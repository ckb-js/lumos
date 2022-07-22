declare type ValueOf<T> = T[keyof T];
export declare function mapObj<Obj extends Record<string, any>, Fn extends (v: ValueOf<Obj>, k: keyof Obj, i: number) => any>(obj: Obj, map: Fn): Record<keyof Obj, ReturnType<Fn>>;
export {};
