import { RefDump } from "./";
import { FS } from "../common/io";
import { fromTmp, fromTest } from "../spec/helper";

import * as reflog from "./reflog";
import { buildState, unbuildState, countReflog, topParser, op2obj } from "./";

const { readText, writeFile } = FS;

/**
 * Test data
 */
let ex_whadido_2: RefDump[];
let ex_tsboilerplate_1: RefDump[];

beforeAll(async () => {
    // ex_whadido_2 = JSON.parse(
    //     await readText(fromTest("whadido-2.json"), { encoding: "utf-8" }));
    ex_tsboilerplate_1 = JSON.parse(
        await readText(fromTest("ts-boilerplate-1.json"), { encoding: "utf-8" }));
});

describe("reflog - parser v2", () => {

    async function commonRoutine(tag: string, filename: string, size: number, parsed: number, remained: number) {
        const ex: RefDump[] = JSON.parse(await readText(fromTest(filename), { encoding: "utf-8" }));

        const initialState = buildState(ex);

        expect(countReflog(initialState)).toEqual(size);

        // should give a unambigious result
        const allResults = topParser(initialState);
        expect(allResults.length).toEqual(1);

        // consumes item(s) and got operation(s)
        const { output, rest } = allResults[0];
        expect([output.length, countReflog(rest)]).toEqual([parsed, remained]);

        await writeFile(fromTmp(`${tag}-output-v2.json`),
            JSON.stringify(output.map(op2obj), undefined, 4));

        await writeFile(fromTmp(`${tag}-rest-v2.json`),
            JSON.stringify(unbuildState(ex, rest), undefined, 4));
    }

    it("topParser(ex_whadido_1)", async () => {
        await commonRoutine("whadido-1", "whadido-1.json", 128, 88, 0);
    });

    it("topParser(bangumi_1)", async () => {
        await commonRoutine("bangumi-1", "bangumi-1.json", 123, 40, 53);
    });

    it("topParser(ex_tsboilerplate_1)", async () => {
        const initialState = buildState(ex_tsboilerplate_1);

        expect(countReflog(initialState)).toEqual(136);

        // should give a unambigious result
        const allResults = topParser(initialState);

        expect(allResults.length).toEqual(1);

        // consumes item(s) and got operation(s)
        const { output, rest } = allResults[0];
        expect([output.length, countReflog(rest)]).toEqual([90, 0]);

        await writeFile(fromTmp("boilerplate-1-output-v2.json"),
            JSON.stringify(output.map(op2obj), undefined, 4));

        await writeFile(fromTmp("boilerplate-1-rest-v2.json"),
            JSON.stringify(unbuildState(ex_tsboilerplate_1, rest), undefined, 4));
    });
});
