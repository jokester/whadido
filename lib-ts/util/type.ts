export type DeepReadonly<T> = {
    readonly [P in keyof T]: DeepReadonly<T[P]>
};

export function deepFreeze<T>(v: T) {
    return v as any as DeepReadonly<T>;
}

export function freeze<T>(v: T) {
    return v as Readonly<T>;
}

// NOT working. I wanted a type that 'exposes' private properties / methods
export type Exposed<T, V extends keyof T> = {
    [P in (V & keyof T)]: T[P]
};
