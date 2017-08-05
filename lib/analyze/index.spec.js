"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const io_1 = require("../common/io");
const helper_1 = require("../spec/helper");
const _1 = require("./");
const { readText, writeFile } = io_1.FS;
/**
 * Test data
 */
let ex_whadido_2;
let ex_tsboilerplate_1;
beforeAll(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
    // ex_whadido_2 = JSON.parse(
    //     await readText(fromTest("whadido-2.json"), { encoding: "utf-8" }));
    ex_tsboilerplate_1 = JSON.parse(yield readText(helper_1.fromTest("ts-boilerplate-1.json"), { encoding: "utf-8" }));
}));
describe("reflog - parser v2", () => {
    function commonRoutine(tag, filename, size, parsed, remained) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const ex = JSON.parse(yield readText(helper_1.fromTest(filename), { encoding: "utf-8" }));
            const initialState = _1.buildState(ex);
            expect(_1.countReflog(initialState)).toEqual(size);
            // should give a unambigious result
            const allResults = _1.topParser(initialState);
            expect(allResults.length).toEqual(1);
            // consumes item(s) and got operation(s)
            const { output, rest } = allResults[0];
            expect([output.length, _1.countReflog(rest)]).toEqual([parsed, remained]);
            yield writeFile(helper_1.fromTmp(`${tag}-output-v2.json`), JSON.stringify(output.map(_1.op2obj), undefined, 4));
            yield writeFile(helper_1.fromTmp(`${tag}-rest-v2.json`), JSON.stringify(_1.unbuildState(ex, rest), undefined, 4));
        });
    }
    it("topParser(ex_whadido_1)", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield commonRoutine("whadido-1", "whadido-1.json", 128, 88, 0);
    }));
    it("topParser(bangumi_1)", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield commonRoutine("bangumi-1", "bangumi-1.json", 123, 40, 53);
    }));
    it("topParser(ex_tsboilerplate_1)", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const initialState = _1.buildState(ex_tsboilerplate_1);
        expect(_1.countReflog(initialState)).toEqual(136);
        // should give a unambigious result
        const allResults = _1.topParser(initialState);
        expect(allResults.length).toEqual(1);
        // consumes item(s) and got operation(s)
        const { output, rest } = allResults[0];
        expect([output.length, _1.countReflog(rest)]).toEqual([90, 0]);
        yield writeFile(helper_1.fromTmp("boilerplate-1-output-v2.json"), JSON.stringify(output.map(_1.op2obj), undefined, 4));
        yield writeFile(helper_1.fromTmp("boilerplate-1-rest-v2.json"), JSON.stringify(_1.unbuildState(ex_tsboilerplate_1, rest), undefined, 4));
    }));
});
//# sourceMappingURL=index.spec.js.map