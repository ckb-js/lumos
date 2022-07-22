export interface Grouped<K, V> {
    get(key: K): V[];
    listKeys(): K[];
    hashKeys(): string[];
}
export declare function identity<T>(x: T): T;
export declare function groupBy<V, GetK extends (val: V) => any>(list: V[], keyGetter: GetK, options?: {
    hashCode: (k: ReturnType<GetK>) => string;
}): Grouped<ReturnType<GetK>, V>;
