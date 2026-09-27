-- Notification Queue System
-- Retry mechanism, delivery history, and idempotency for push notifications

-- Notification Queue Table
create table if not exists public.notification_queue (
  id uuid primary key default gen_random_uuid(),
  subscription_endpoint text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  priority integer not null default 0,
  scheduled_for timestamptz not null default now(),
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  last_attempt_at timestamptz,
  next_attempt_at timestamptz,
  error_message text,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for notification queue
create index if not exists notification_queue_status_idx on public.notification_queue (status, next_attempt_at);
create index if not exists notification_queue_subscription_idx on public.notification_queue (subscription_endpoint);
create index if not exists notification_queue_idempotency_idx on public.notification_queue (idempotency_key);
create index if not exists notification_queue_scheduled_idx on public.notification_queue (scheduled_for);

-- Notification History Table
create table if not exists public.notification_history (
  id uuid primary key default gen_random_uuid(),
  subscription_endpoint text not null,
  payload jsonb not null,
  status text not null check (status in ('sent', 'failed', 'cancelled')),
  sent_at timestamptz,
  error_message text,
  delivery_time_ms integer,
  idempotency_key text,
  created_at timestamptz not null default now()
);

-- Indexes for notification history
create index if not exists notification_history_subscription_idx on public.notification_history (subscription_endpoint);
create index if not exists notification_history_status_idx on public.notification_history (status, created_at);
create index if not exists notification_history_idempotency_idx on public.notification_history (idempotency_key);
create index if not exists notification_history_created_idx on public.notification_history (created_at desc);

-- Notification Retry Log Table
create table if not exists public.notification_retry_log (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid references public.notification_queue(id) on delete cascade,
  attempt_number integer not null,
  status text not null check (status in ('attempt', 'success', 'failed')),
  error_message text,
  response_code integer,
  response_body text,
  created_at timestamptz not null default now()
);

-- Indexes for retry log
create index if not exists notification_retry_log_queue_idx on public.notification_retry_log (queue_id, created_at);
create index if not exists notification_retry_log_status_idx on public.notification_retry_log (status, created_at);

-- Function to add notification to queue with idempotency
create or replace function public.add_to_queue(
  p_subscription_endpoint text,
  p_payload jsonb,
  p_priority integer default 0,
  p_scheduled_for timestamptz default now(),
  p_idempotency_key text default null,
  p_max_attempts integer default 3
)
returns uuid as $$
  declare
    existing_id uuid;
    queue_id uuid;
  begin
    -- Check for idempotency
    if p_idempotency_key is not null then
      select id into existing_id 
      from public.notification_history 
      where idempotency_key = p_idempotency_key 
      limit 1;
      
      if existing_id is not null then
        return existing_id; -- Already sent
      end
      
      select id into existing_id 
      from public.notification_queue 
      where idempotency_key = p_idempotency_key 
      limit 1;
      
      if existing_id is not null then
        return existing_id; -- Already in queue
      end;
    end
    
    -- Add to queue
    insert into public.notification_queue (
      subscription_endpoint,
      payload,
      priority,
      scheduled_for,
      idempotency_key,
      max_attempts
    ) values (
      p_subscription_endpoint,
      p_payload,
      p_priority,
      p_scheduled_for,
      p_idempotency_key,
      p_max_attempts
    ) returning id into queue_id;
    
    return queue_id;
  end;
$$ language plpgsql security definer;

-- Function to mark notification as sent
create or replace function public.mark_notification_sent(
  p_queue_id uuid,
  p_delivery_time_ms integer
)
returns void as $$
  declare
    queue_item record;
  begin
    -- Get queue item
    select * into queue_item 
    from public.notification_queue 
    where id = p_queue_id;
    
    if not found then
      return;
    end;
    
    -- Add to history
    insert into public.notification_history (
      subscription_endpoint,
      payload,
      status,
      sent_at,
      delivery_time_ms,
      idempotency_key
    ) values (
      queue_item.subscription_endpoint,
      queue_item.payload,
      'sent',
      now(),
      p_delivery_time_ms,
      queue_item.idempotency_key
    );
    
    -- Update queue status
    update public.notification_queue 
    set 
      status = 'sent',
      updated_at = now()
    where id = p_queue_id;
  end;
$$ language plpgsql security definer;

-- Function to mark notification as failed and schedule retry
create or replace function public.mark_notification_failed(
  p_queue_id uuid,
  p_error_message text,
  p_response_code integer default null,
  p_response_body text default null
)
returns void as $$
  declare
    queue_item record;
    next_attempt timestamptz;
    retry_delay interval;
  begin
    -- Get queue item
    select * into queue_item 
    from public.notification_queue 
    where id = p_queue_id;
    
    if not found then
      return;
    end;
    
    -- Increment attempts
    update public.notification_queue 
    set 
      attempts = attempts + 1,
      last_attempt_at = now(),
      updated_at = now()
    where id = p_queue_id
    returning * into queue_item;
    
    -- Log retry attempt
    insert into public.notification_retry_log (
      queue_id,
      attempt_number,
      status,
      error_message,
      response_code,
      response_body
    ) values (
      p_queue_id,
      queue_item.attempts,
      'failed',
      p_error_message,
      p_response_code,
      p_response_body
    );
    
    -- Check if max attempts reached
    if queue_item.attempts >= queue_item.max_attempts then
      -- Mark as permanently failed
      update public.notification_queue 
      set 
        status = 'failed',
        error_message = p_error_message,
        updated_at = now()
      where id = p_queue_id;
      
      -- Add to history as failed
      insert into public.notification_history (
        subscription_endpoint,
        payload,
        status,
        error_message,
        idempotency_key
      ) values (
        queue_item.subscription_endpoint,
        queue_item.payload,
        'failed',
        p_error_message,
        queue_item.idempotency_key
      );
    else
      -- Calculate retry delay with exponential backoff
      retry_delay = make_interval(
        mins => (2 ^ (queue_item.attempts - 1)) * 5  -- 5, 10, 20, 40 minutes
      );
      
      next_attempt := now() + retry_delay;
      
      -- Schedule next attempt
      update public.notification_queue 
      set 
        status = 'pending',
        next_attempt_at = next_attempt,
        updated_at = now()
      where id = p_queue_id;
    end;
  end;
$$ language plpgsql security definer;

-- Function to get pending notifications for processing
create or replace function public.get_pending_notifications(
  p_limit integer default 100
)
returns table (
  id uuid,
  subscription_endpoint text,
  payload jsonb,
  priority integer,
  scheduled_for timestamptz,
  idempotency_key text
) as $$
  begin
    return query
    select 
      id,
      subscription_endpoint,
      payload,
      priority,
      scheduled_for,
      idempotency_key
    from public.notification_queue
    where 
      status = 'pending'
      and scheduled_for <= now()
    order by 
      priority desc,
      scheduled_for asc,
      created_at asc
    limit p_limit;
  end;
$$ language plpgsql security definer;

-- Enable RLS
alter table public.notification_queue enable row level security;
alter table public.notification_history enable row level security;
alter table public.notification_retry_log enable row level security;

-- RLS Policies for notification queue
drop policy if exists notification_queue_select_policy on public.notification_queue;
drop policy if exists notification_queue_insert_policy on public.notification_queue;
drop policy if exists notification_queue_update_policy on public.notification_queue;
drop policy if exists notification_queue_delete_policy on public.notification_queue;

create policy "notification_queue_select_policy" on public.notification_queue
  for select
  to authenticated
  using (public.get_user_role() in ('admin', 'editor'));

create policy "notification_queue_insert_policy" on public.notification_queue
  for insert
  to authenticated
  with check (public.get_user_role() = 'admin');

create policy "notification_queue_update_policy" on public.notification_queue
  for update
  to authenticated
  with check (public.get_user_role() = 'admin');

create policy "notification_queue_delete_policy" on public.notification_queue
  for delete
  to authenticated
  using (public.get_user_role() = 'admin');

-- RLS Policies for notification history
drop policy if exists notification_history_select_policy on public.notification_history;
drop policy if exists notification_history_insert_policy on public.notification_history;
drop policy if exists notification_history_update_policy on public.notification_history;
drop policy if exists notification_history_delete_policy on public.notification_history;

create policy "notification_history_select_policy" on public.notification_history
  for select
  to authenticated
  using (public.get_user_role() in ('admin', 'editor'));

create policy "notification_history_insert_policy" on public.notification_history
  for insert
  to authenticated
  with check (true); -- System inserts

create policy "notification_history_update_policy" on public.notification_history
  for update
  to authenticated
  with check (false); -- Immutable

create policy "notification_history_delete_policy" on public.notification_history
  for delete
  to authenticated
  using (public.get_user_role() = 'admin');

-- RLS Policies for retry log
drop policy if exists notification_retry_log_select_policy on public.notification_retry_log;
drop policy if exists notification_retry_log_insert_policy on public.notification_retry_log;
drop policy if exists notification_retry_log_update_policy on public.notification_retry_log;
drop policy if exists notification_retry_log_delete_policy on public.notification_retry_log;

create policy "notification_retry_log_select_policy" on public.notification_retry_log
  for select
  to authenticated
  using (public.get_user_role() in ('admin', 'editor'));

create policy "notification_retry_log_insert_policy" on public.notification_retry_log
  for insert
  to authenticated
  with check (true); -- System inserts

create policy "notification_retry_log_update_policy" on public.notification_retry_log
  for update
  to authenticated
  with check (false); -- Immutable

create policy "notification_retry_log_delete_policy" on public.notification_retry_log
  for delete
  to authenticated
  using (public.get_user_role() = 'admin');

-- Grant service role bypass
grant all on all tables in public to service_role;
grant all on all sequences in public to service_role;
grant all on all functions in public to service_role;

-- Comments
comment on table public.notification_queue is 'Notification queue for push notifications with retry logic and idempotency.';
comment on table public.notification_history is 'Delivery history for all sent notifications.';
comment on table public.notification_retry_log is 'Retry attempt logs for failed notifications.';
comment on function public.add_to_queue is 'Add notification to queue with idempotency check.';
comment on function public.mark_notification_sent is 'Mark notification as successfully sent and move to history.';
comment on function public.mark_notification_failed is 'Mark notification as failed and schedule retry with exponential backoff.';
comment on function public.get_pending_notifications is 'Get pending notifications ready for processing.';
