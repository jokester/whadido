"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Transform (err, result)=>void callback to promise
 *
 * NOTE: not working well with overloaded functions
 * NOTE: not working well with parameter names
 */
var Callback2Promise;
(function (Callback2Promise) {
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
    Callback2Promise.toPromise1 = toPromise1;
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
    Callback2Promise.toPromise2 = toPromise2;
    Callback2Promise.toPromise0 = toPromise1;
})(Callback2Promise || (Callback2Promise = {}));
exports.toPromise0 = Callback2Promise.toPromise0;
exports.toPromise1 = Callback2Promise.toPromise1;
exports.toPromise2 = Callback2Promise.toPromise2;
var WIP;
(function (WIP) {
    function toPromise(origApi) {
        return function (a1, a2) {
            return new Promise((fulfill, reject) => {
                origApi(a1, a2, (err, result) => {
                    if (err)
                        reject(err);
                    else
                        fulfill(result);
                });
            });
        };
    }
    WIP.toPromise = toPromise;
})(WIP || (WIP = {}));
/**
 * Lift a function's argument and return value to Promise
 */
exports.liftPromise = function (fun, thisArg) {
    return function () {
        const args = [].slice.call(arguments);
        return Promise.all(args).then(gotAwaits => fun.apply(thisArg, gotAwaits));
    };
};
//# sourceMappingURL=promisify.js.map