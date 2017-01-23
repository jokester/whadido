"use strict";
const tslib_1 = require("tslib");
function LiftPromiseArray(from) {
    return Promise.all(from);
}
/**
 * lift2 f to Promise
 */
function liftA2(f) {
    function transformed(pa1, pa2) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const v1 = yield pa1;
            const v2 = yield pa2;
            return Promise.resolve(f(v1, v2));
        });
    }
    return transformed;
}
exports.liftA2 = liftA2;
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
     * unwraps ArrayM<T> and returns an array T[]
     */
    toArray() {
        return this.array.slice();
    }
}
exports.ArrayM = ArrayM;
//# sourceMappingURL=transforms.js.map