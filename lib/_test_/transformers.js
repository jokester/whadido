"use strict";
const tslib_1 = require("tslib");
const mocha_typescript_1 = require("mocha-typescript");
const chai_1 = require("chai");
const transforms_1 = require("../util/transforms");
let TestTransformers = class TestTransformers {
    liftA2() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const liftedPlus = transforms_1.liftA2((a, b) => a + b);
            const sum = yield liftedPlus(3, Promise.resolve(5));
            chai_1.expect(sum).eq(8);
        });
    }
};
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", Promise)
], TestTransformers.prototype, "liftA2", null);
TestTransformers = tslib_1.__decorate([
    mocha_typescript_1.suite
], TestTransformers);
//# sourceMappingURL=transformers.js.map