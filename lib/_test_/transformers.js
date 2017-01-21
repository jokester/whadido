"use strict";
const tslib_1 = require("tslib");
const mocha_typescript_1 = require("mocha-typescript");
const chai_1 = require("chai");
const transforms_1 = require("../util/transforms");
let TestTransformers = class TestTransformers {
    liftA2() {
        return transforms_1.liftA2((a, b) => a + b)(3, Promise.resolve(5)).then(sum => chai_1.expect(sum).eq(8));
    }
};
tslib_1.__decorate([
    mocha_typescript_1.test,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], TestTransformers.prototype, "liftA2", null);
TestTransformers = tslib_1.__decorate([
    mocha_typescript_1.suite
], TestTransformers);
//# sourceMappingURL=transformers.js.map