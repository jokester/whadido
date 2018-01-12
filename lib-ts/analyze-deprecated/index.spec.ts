
import { RefDump } from "./";
import { FS } from "../common/io";
import * as reflog from "./reflog";

import { fromTmp, fromTest } from "../spec/helper";

const { readText, writeFile } = FS;

/**
 * Test data
 */
let ex_whadido_1: RefDump[];
let ex_whadido_2: RefDump[];
let ex_tsboilerplate_1: RefDump[];

beforeAll(async () => {
    ex_whadido_1 = JSON.parse(
        await readText(fromTest("whadido-1.json"), { encoding: "utf-8" }));
    // ex_whadido_2 = JSON.parse(
    //     await readText(fromTest("whadido-2.json"), { encoding: "utf-8" }));
    ex_tsboilerplate_1 = JSON.parse(
        await readText(fromTest("ts-boilerplate-1.json"), { encoding: "utf-8" }));
});

xdescribe("reflog - parser v1", () => {

    it("reads example.json", () => {
        expect(ex_whadido_1.length).toEqual(10);
        expect(ex_tsboilerplate_1.length).toEqual(20);
    });

    it("parses ts-boilerplate-1.json", async () => {

        expect(reflog.countReflog(ex_tsboilerplate_1)).toEqual(136);

        const v = reflog.analyzeDump(ex_tsboilerplate_1);
        expect(v.length).toEqual(1);

        const rest = reflog.unmap(v[0].rest);

        expect(reflog.countReflog(rest)).toEqual(0);

        await writeFile(fromTmp("boilerplate-1-rest.json"), JSON.stringify(rest, undefined, 4));
    });

    it("parses whadido-1.json", async () => {

        expect(reflog.countReflog(ex_whadido_1)).toEqual(128);

        const v = reflog.analyzeDump(ex_whadido_1);
        expect(v.length).toEqual(1);

        const rest = reflog.unmap(v[0].rest);

        expect(reflog.countReflog(rest)).toEqual(0);

        await writeFile(fromTmp("whadido-1-rest.json"), JSON.stringify(rest, undefined, 4));
    });

    xit("parses whadido-2.json", async () => {

        expect(reflog.countReflog(ex_whadido_2)).toEqual(283);

        const v = reflog.analyzeDump(ex_whadido_2);
        expect(v.length).toEqual(1);

        const rest = reflog.unmap(v[0].rest);

        expect(reflog.countReflog(rest)).toEqual(1);

        await writeFile(fromTmp("whadido-2-rest.json"), JSON.stringify(rest, undefined, 4));
    });
});
