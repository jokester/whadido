"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/**
 * Type transformers and etc
 */
var freeze_1 = require("./freeze");
exports.freeze = freeze_1.freeze;
exports.deepFreeze = freeze_1.deepFreeze;
var promisify_1 = require("./promisify");
exports.toPromise1 = promisify_1.toPromise1;
exports.liftPromise = promisify_1.liftPromise;
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
//# sourceMappingURL=index.js.map