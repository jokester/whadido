function LiftPromiseArray<T>(from: Promise<T>[]): Promise<T[]> {
    return Promise.all(from);
}

/**
 * lift2 f to Promise
 */
export function liftA2<T1, T2, T3>(f: (a1: T1, a2: T2) => T3) {
    async function transformed(pa1: Promise<T1> | T1, pa2: Promise<T2> | T2): Promise<T3> {
        const v1 = await pa1;
        const v2 = await pa2;
        return Promise.resolve(f(v1, v2));
    }
    return transformed;
}

/**
 * A wrapper for Array Monad
 */
export class ArrayM<T> {

    static wrap<T>(a: T[]) {
        return new ArrayM(a);
    }

    constructor(private array: T[]) { }

    /**
     * >>= : taken from List Monad
     */
    bind<T2>(action: (v: T, index?: number, wholeArray?: T[]) => T2[]): ArrayM<T2> {
        let result = [] as T2[];

        this.array.forEach((v, i) => {
            const r = action(v, i, this.array);
            result = result.concat(r);
        })

        return new ArrayM(result);
    }

    /**
     * map: a instance of Functor fmap
     */
    map<T2>(iteratee: (v: T, index?: number, wholeArray?: T[]) => T2): ArrayM<T2> {
        return new ArrayM(this.array.map(iteratee));
    }

    /**
     * filter: delegates to Array#filter
     */
    filter(predicate: (v: T, index?: number) => boolean): ArrayM<T> {
        return new ArrayM(this.array.filter(predicate));
    }

    /**
     * unwraps ArrayM<T> and returns an array T[]
     */
    toArray() {
        return this.array.slice();
    }
}