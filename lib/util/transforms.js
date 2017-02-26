"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
/**
 * Methods that convert (err, result)=>void callback to promise
 *
 * NOTE not working well with overloaded functions
 * NOTE not working well with parameter names
 */
var Promisify;
(function (Promisify) {
    function toPromise1(fun) {
        return (arg1) => new Promise((resolve, reject) => {
            fun(arg1, (err, result) => {
                if (err)
                    reject(err);
                else
                    resolve(result);
            });
        });
    }
    Promisify.toPromise1 = toPromise1;
    /**
     * partial specialization of toPromise1 where R is void
     */
    function toPromise1v(fun) {
        return toPromise1(fun);
    }
    Promisify.toPromise1v = toPromise1v;
    function toPromise2(fun) {
        return (arg1, arg2) => new Promise((resolve, reject) => {
            fun(arg1, arg2, (err, result) => {
                if (err)
                    reject(err);
                else
                    resolve(result);
            });
        });
    }
    Promisify.toPromise2 = toPromise2;
    /**
     * partial specialization of toPromise2 where R is void
     */
    function toPromise2v(fun) {
        return toPromise2(fun);
    }
    Promisify.toPromise2v = toPromise2v;
})(Promisify = exports.Promisify || (exports.Promisify = {}));
//# sourceMappingURL=transforms.js.map