"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const io_1 = require("../util/io");
const reflog_1 = require("./reflog");
describe("reflog.parser", () => {
    let ex1;
    let ts_boilerplate_dump;
    beforeEach(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        ex1 = JSON.parse(yield io_1.readText(io_1.fromTest("whadido-1.json"), { encoding: "utf-8" }));
        ts_boilerplate_dump = JSON.parse(yield io_1.readText(io_1.fromTest("ts-boilerplate-1.json"), { encoding: "utf-8" }));
    }));
    it("reads example.json", () => {
        expect(ex1.length).toEqual(12);
        expect(ts_boilerplate_dump.length).toEqual(20);
    });
    it("parses remote fetch & push", () => {
        const v = reflog_1.analyzeDump(ts_boilerplate_dump, { remoteFetch: true, remotePush: true });
        // it should be unambigious
        expect(v.length).toEqual(1);
        expect(v[0].output.length).toEqual(27);
    });
});
//# sourceMappingURL=reflog.spec.js.map