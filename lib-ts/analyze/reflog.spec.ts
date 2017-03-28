
import { RefDump } from "./index";
import { readText, fromTest, fromTmp, writeFile } from "../util/io";
import { analyzeDump, countReflog, unmap } from "./reflog";

describe("reflog.parser", () => {

    let ex_whadido_1: RefDump[];
    let ex_tsboilerplate_1: RefDump[];

    beforeEach(async () => {
        ex_whadido_1 = JSON.parse(
            await readText(fromTest("whadido-1.json"), { encoding: "utf-8" }));
        ex_tsboilerplate_1 = JSON.parse(
            await readText(fromTest("ts-boilerplate-1.json"), { encoding: "utf-8" }));
    });

    it("reads example.json", () => {
        expect(ex_whadido_1.length).toEqual(10);
        expect(ex_tsboilerplate_1.length).toEqual(20);
    });

    it("parses ts-boilerplate-1.json with all options", async () => {

        expect(countReflog(ex_tsboilerplate_1)).toEqual(136);

        const v = analyzeDump(ex_tsboilerplate_1);
        expect(v.length).toEqual(1);

        const rest = unmap(v[0].rest);

        expect(countReflog(rest)).toEqual(2);

        await writeFile(fromTmp("boilerplate-1-rest.json"), JSON.stringify(rest, undefined, 4));
    });


    it("parses whadido-1.json with all options", async () => {

        expect(countReflog(ex_whadido_1)).toEqual(128);

        const v = analyzeDump(ex_whadido_1);
        expect(v.length).toEqual(1);

        const rest = unmap(v[0].rest);

        expect(countReflog(rest)).toEqual(91);

        await writeFile(fromTmp("whadido-1-rest.json"), JSON.stringify(rest, undefined, 4));
    });
});