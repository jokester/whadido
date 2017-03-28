"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const io_1 = require("../util/io");
const reflog_1 = require("./reflog");
describe("reflog.parser", () => {
    let ex_whadido_1;
    let ex_tsboilerplate_1;
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        ex_whadido_1 = JSON.parse(yield io_1.readText(io_1.fromTest("whadido-1.json"), { encoding: "utf-8" }));
        ex_tsboilerplate_1 = JSON.parse(yield io_1.readText(io_1.fromTest("ts-boilerplate-1.json"), { encoding: "utf-8" }));
    }));
    it("reads example.json", () => {
        expect(ex_whadido_1.length).toEqual(10);
        expect(ex_tsboilerplate_1.length).toEqual(20);
    });
    it("parses ts-boilerplate-1.json with all options", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        expect(reflog_1.countReflog(ex_tsboilerplate_1)).toEqual(136);
        const v = reflog_1.analyzeDump(ex_tsboilerplate_1);
        expect(v.length).toEqual(1);
        const rest = reflog_1.unmap(v[0].rest);
        expect(reflog_1.countReflog(rest)).toEqual(2);
        yield io_1.writeFile(io_1.fromTmp("boilerplate-1-rest.json"), JSON.stringify(rest, undefined, 4));
    }));
    it("parses whadido-1.json with all options", () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        expect(reflog_1.countReflog(ex_whadido_1)).toEqual(128);
        const v = reflog_1.analyzeDump(ex_whadido_1);
        expect(v.length).toEqual(1);
        const rest = reflog_1.unmap(v[0].rest);
        expect(reflog_1.countReflog(rest)).toEqual(91);
        yield io_1.writeFile(io_1.fromTmp("whadido-1-rest.json"), JSON.stringify(rest, undefined, 4));
    }));
});
//# sourceMappingURL=reflog.spec.js.map