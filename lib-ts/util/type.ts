export type DeepReadonly<T> = {
    readonly[P in keyof T]: DeepReadonly<T[P]>
};

export function deepFreeze<T>(v: T) {
    return v as any as DeepReadonly<T>
}

export function freeze<T>(v: T) {
    return v as Readonly<T>;
}


type x = Readonly<RegExp>

type y = DeepReadonly<RegExp>