/** Bounded client cache. Empty city datasets are valid entries too. */
export class TimedCache<T> {
  private entries = new Map<string, { value: T; at: number }>();
  constructor(private ttlMs = 300_000, private limit = 100) {}
  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.at >= this.ttlMs) { this.entries.delete(key); return undefined; }
    return entry.value;
  }
  set(key: string, value: T) {
    this.entries.delete(key);
    if (this.entries.size >= this.limit) this.entries.delete(this.entries.keys().next().value!);
    this.entries.set(key, { value, at: Date.now() });
  }
}
