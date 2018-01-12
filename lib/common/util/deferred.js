"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function nop() { }
/**
 * Deferred: a wrapper for Promise that exposes fulfill / reject / resolved
 */
class Deferred {
    constructor(strict = false) {
        this.strict = strict;
        this.resolved = false;
        const self = this;
        this._promise = new Promise((fulfill, reject) => {
            self._fulfill = (v) => {
                fulfill(v);
                self.resolved = true;
                self._fulfill = self._reject = nop;
            };
            self._reject = (e) => {
                reject(e);
                self.resolved = true;
                self._fulfill = self._reject = nop;
            };
        });
    }
    toPromise() {
        return this._promise;
    }
    follow(pv) {
        pv.then(this._fulfill, this._reject);
    }
    /**
     * NOTE v must be a value
     * @param v the value
     */
    fulfill(v) {
        if (this.strict && this.resolved) {
            throw new Error("already resolved");
        }
        else {
            this._fulfill(v);
        }
    }
    reject(e) {
        if (this.strict && this.resolved) {
            throw new Error("already resolved");
        }
        else {
            this._reject(e);
        }
    }
}
exports.Deferred = Deferred;
//# sourceMappingURL=deferred.js.map