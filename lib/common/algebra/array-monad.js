"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A wrapper for Array Monad
 */
class ArrayM {
    constructor(array) {
        this.array = array;
    }
    static wrap(a) {
        return new ArrayM(a);
    }
    /**
     * >>= : taken from List Monad
     */
    bind(action) {
        let result = [];
        this.array.forEach((v, i) => {
            const r = action(v, i, this.array);
            result = result.concat(r);
        });
        return new ArrayM(result);
    }
    /**
     * map: a instance of Functor fmap
     */
    map(iteratee) {
        return new ArrayM(this.array.map(iteratee));
    }
    /**
     * filter: delegates to Array#filter
     */
    filter(predicate) {
        return new ArrayM(this.array.filter(predicate));
    }
    /**
     * unwraps ArrayM<T> and returns an array T[]
     */
    toArray() {
        return this.array.slice();
    }
}
exports.ArrayM = ArrayM;
//# sourceMappingURL=array-monad.js.map