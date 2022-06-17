export interface Grouped<K, V> {
  get(key: K): V[];
  listKeys(): K[];
  hashKeys(): string[];
}

export function identity<T>(x: T): T {
  return x;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function groupBy<V, GetK extends (val: V) => any>(
  list: V[],
  keyGetter: GetK,
  options?: {
    hashCode: (k: ReturnType<GetK>) => string;
  }
): Grouped<ReturnType<GetK>, V> {
  const map = new Map<string, V[]>();
  const { hashCode = JSON.stringify } = options || {};

  const originKeys: ReturnType<GetK>[] = [];
  const hashKeys: string[] = [];

  list.forEach((val) => {
    const key = hashCode(keyGetter(val));

    if (!map.has(key)) {
      originKeys.push(keyGetter(val));
    }

    const group = map.get(key) || [];
    group.push(val);
    map.set(key, group);
  });

  return {
    get(key) {
      const group = map.get(hashCode(key));
      if (!group) return [];
      return group;
    },

    listKeys() {
      return originKeys;
    },

    hashKeys() {
      return hashKeys;
    },
  };
}
