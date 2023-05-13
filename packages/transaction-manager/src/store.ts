export type Promisable<T> = PromiseLike<T> | T;
type KeyOf<T> = keyof T & string;

/**
 * key-value storage
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Store<Schema = any> {
  hasItem<K extends KeyOf<Schema>>(key: K): Promisable<boolean>;
  getItem<K extends KeyOf<Schema>>(key: K): Promisable<Schema[K] | undefined>;
  removeItem<K extends KeyOf<Schema>>(key: K): Promisable<void>;
  setItem<K extends KeyOf<Schema>>(key: K, value: Schema[K]): Promisable<void>;
}

export function createInMemoryStorage<S>(): Store<S> {
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
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}
