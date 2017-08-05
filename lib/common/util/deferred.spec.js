"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const deferred_1 = require("./deferred");
describe("Deferred", () => {
    it("resolves when fulfill() is called", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const p = new deferred_1.Deferred();
        expect(p.resolved).toBe(false);
        p.fulfill("hey");
        expect(p.resolved).toBe(true);
        expect(yield p.toPromise()).toBe("hey");
        p.fulfill("ho");
        expect(yield p.toPromise()).toBe("hey");
        p.reject(1);
        expect(yield p.toPromise()).toBe("hey");
    }));
    it("resolves when reject() called", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const p = new deferred_1.Deferred();
        expect(p.resolved).toBe(false);
        p.reject("ho");
        expect(p.resolved).toBe(true);
        let reason;
        try {
            yield p.toPromise();
        }
        catch (e) {
            reason = e;
        }
        expect(reason).toEqual("ho");
    }));
    it("throws on fulfill()/reject() if strict is true", () => {
        const p = new deferred_1.Deferred(true);
        p.fulfill("");
        expect(() => p.fulfill("3")).toThrow("already resolved");
        expect(() => p.reject("3")).toThrow("already resolved");
    });
});
//# sourceMappingURL=deferred.spec.js.map