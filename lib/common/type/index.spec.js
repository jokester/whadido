"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _1 = require(".");
describe("promisify", () => {
    it("runs", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        function foo0() { }
        function foo1(a) {
            return a + 1;
        }
        const result0 = yield _1.liftPromise(foo0);
        const result1 = yield _1.liftPromise(foo1)(2);
        expect(result1).toEqual(3);
        function foo5(a1, a2, a3, a4, a5) {
            return [a1, a2, a3].join(`${a4}${a5}`);
        }
        const result5 = yield _1.liftPromise(foo5)(Promise.resolve("a"), "b", "c", 5, false);
        expect(result5).toEqual("a5falseb5falsec");
    }));
});
describe("liftA2", () => {
    it("lifts a sync function to promise", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const liftedPlus = _1.liftA2((a, b) => a + b);
        const sum = yield liftedPlus(3, Promise.resolve(5));
        expect(sum).toEqual(8);
    }));
});
//# sourceMappingURL=index.spec.js.map