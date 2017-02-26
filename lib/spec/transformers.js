"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const chai_1 = require("chai");
const transforms_1 = require("../util/transforms");
describe("liftA2", () => {
    it("lifts a sync function to promise", (done) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const liftedPlus = transforms_1.liftA2((a, b) => a + b);
        const sum = yield liftedPlus(3, Promise.resolve(5));
        chai_1.expect(sum).eq(8);
        done();
    }));
});
//# sourceMappingURL=transformers.js.map