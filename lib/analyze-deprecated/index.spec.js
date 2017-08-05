"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const io_1 = require("../common/io");
const reflog = require("./reflog");
const helper_1 = require("../spec/helper");
const { readText, writeFile } = io_1.FS;
/**
 * Test data
 */
let ex_whadido_1;
let ex_whadido_2;
let ex_tsboilerplate_1;
beforeAll(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
    ex_whadido_1 = JSON.parse(yield readText(helper_1.fromTest("whadido-1.json"), { encoding: "utf-8" }));
    // ex_whadido_2 = JSON.parse(
    //     await readText(fromTest("whadido-2.json"), { encoding: "utf-8" }));
    ex_tsboilerplate_1 = JSON.parse(yield readText(helper_1.fromTest("ts-boilerplate-1.json"), { encoding: "utf-8" }));
}));
xdescribe("reflog - parser v1", () => {
    it("reads example.json", () => {
        expect(ex_whadido_1.length).toEqual(10);
        expect(ex_tsboilerplate_1.length).toEqual(20);
    });
    it("parses ts-boilerplate-1.json", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        expect(reflog.countReflog(ex_tsboilerplate_1)).toEqual(136);
        const v = reflog.analyzeDump(ex_tsboilerplate_1);
        expect(v.length).toEqual(1);
        const rest = reflog.unmap(v[0].rest);
        expect(reflog.countReflog(rest)).toEqual(0);
        yield writeFile(helper_1.fromTmp("boilerplate-1-rest.json"), JSON.stringify(rest, undefined, 4));
    }));
    it("parses whadido-1.json", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        expect(reflog.countReflog(ex_whadido_1)).toEqual(128);
        const v = reflog.analyzeDump(ex_whadido_1);
        expect(v.length).toEqual(1);
        const rest = reflog.unmap(v[0].rest);
        expect(reflog.countReflog(rest)).toEqual(0);
        yield writeFile(helper_1.fromTmp("whadido-1-rest.json"), JSON.stringify(rest, undefined, 4));
    }));
    xit("parses whadido-2.json", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        expect(reflog.countReflog(ex_whadido_2)).toEqual(283);
        const v = reflog.analyzeDump(ex_whadido_2);
        expect(v.length).toEqual(1);
        const rest = reflog.unmap(v[0].rest);
        expect(reflog.countReflog(rest)).toEqual(1);
        yield writeFile(helper_1.fromTmp("whadido-2-rest.json"), JSON.stringify(rest, undefined, 4));
    }));
});
//# sourceMappingURL=index.spec.js.map