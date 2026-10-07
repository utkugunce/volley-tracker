/** Basit, boyutu sınırlı LRU önbellek (en uzun süre kullanılmayan kayıt önce atılır). */
export interface LruCache<V> {
  get(key: string): V | undefined;
  set(key: string, value: V): void;
  readonly size: number;
}

export function createLruCache<V>(maxEntries: number): LruCache<V> {
  const store = new Map<string, V>();
  const max = Math.max(1, Math.floor(maxEntries));
  return {
    get(key) {
      const value = store.get(key);
      if (value !== undefined) {
        store.delete(key);
        store.set(key, value);
      }
      return value;
    },
    set(key, value) {
      store.delete(key);
      store.set(key, value);
      while (store.size > max) {
        const oldest = store.keys().next().value;
        if (oldest === undefined) break;
        store.delete(oldest);
      }
    },
    get size() {
      return store.size;
    },
  };
}
