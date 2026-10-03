/** Testler için küçük bir Supabase sorgu oluşturucu taklidi (zincirlenebilir, thenable). */
import { vi } from "vitest";

export interface FakeCall {
  table: string;
  op: "select" | "insert" | "update" | "delete" | "upsert";
  payload?: unknown;
  filters: Record<string, unknown>;
}

type Result = { data: unknown; error: unknown; count?: number | null };

export function makeFakeDb(handler: (call: FakeCall) => Result | Promise<Result>) {
  const calls: FakeCall[] = [];
  const from = vi.fn((table: string) => {
    const call: FakeCall = { table, op: "select", filters: {} };
    const run = async () => {
      calls.push(call);
      return handler(call);
    };
    const builder: Record<string, unknown> = {};
    const chain = () => builder;
    builder.select = vi.fn(() => builder);
    builder.insert = vi.fn((p: unknown) => ((call.op = "insert"), (call.payload = p), builder));
    builder.update = vi.fn((p: unknown) => ((call.op = "update"), (call.payload = p), builder));
    builder.upsert = vi.fn((p: unknown) => ((call.op = "upsert"), (call.payload = p), builder));
    builder.delete = vi.fn(() => ((call.op = "delete"), builder));
    builder.eq = vi.fn((k: string, v: unknown) => ((call.filters[k] = v), builder));
    builder.or = vi.fn((v: string) => ((call.filters.or = v), builder));
    builder.order = vi.fn(chain);
    builder.limit = vi.fn(chain);
    builder.single = vi.fn(() => run().then((r) => ({ ...r, data: Array.isArray(r.data) ? r.data[0] : r.data })));
    builder.maybeSingle = vi.fn(() => run().then((r) => ({ ...r, data: Array.isArray(r.data) ? r.data[0] ?? null : r.data ?? null })));
    builder.then = (resolve: (v: Result) => unknown, reject: (e: unknown) => unknown) => run().then(resolve, reject);
    return builder;
  });
  return { db: { from } as never, calls, from };
}
