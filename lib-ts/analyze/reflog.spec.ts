
import { RefDump } from "./index";
import { readText, fromTest } from "../util/io";
import { analyzeDump } from "./reflog";

describe("reflog.parser", () => {

    let ex1: RefDump[];
    let ts_boilerplate_dump: RefDump[];

    beforeEach(async () => {
        ex1 = JSON.parse(
            await readText(fromTest("whadido-1.json"), { encoding: "utf-8" }));
        ts_boilerplate_dump = JSON.parse(
            await readText(fromTest("ts-boilerplate-1.json"), { encoding: "utf-8" }));
    });

    it("reads example.json", () => {
        expect(ex1.length).toEqual(12);
        expect(ts_boilerplate_dump.length).toEqual(20);
    });

    it("parses remote fetch & push", () => {
        const v = analyzeDump(ts_boilerplate_dump, { remoteFetch: true, remotePush: true });
        // it should be unambigious
        expect(v.length).toEqual(1);
        expect(v[0].output.length).toEqual(27);
    });
});