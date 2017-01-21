"use strict";
const tslib_1 = require("tslib");
function LiftPromiseArray(from) {
    return Promise.all(from);
}
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
//# sourceMappingURL=transforms.js.map