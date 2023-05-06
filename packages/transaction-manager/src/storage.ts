export type Promisable<T> = PromiseLike<T> | T;

/**
 * key-value storage
 */
export interface Storage<Schema> {
  hasItem<K extends keyof Schema>(key: K): Promisable<boolean>;
  getItem<K extends keyof Schema>(key: K): Promisable<Schema[K] | undefined>;
  removeItem<K extends keyof Schema>(key: K): Promisable<boolean>;
  setItem<K extends keyof Schema>(key: K, value: Schema[K]): Promisable<void>;
}

export function createInMemoryStorage<S>(): Storage<S> {
  const store = new Map();
  return {
    getItem(key) {
      const value = store.get(key) as string | undefined;
      if (!value) return value as undefined;
      // deep clone to avoid the value being modified by the caller
      return JSON.parse(JSON.stringify(value));
    },
    hasItem(key) {
      return store.has(key);
    },
    removeItem(key) {
      return store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}
