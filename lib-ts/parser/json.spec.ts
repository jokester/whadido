import * as json from "./json";

xdescribe("json parser", () => {
    it("parses token", () => {
        expect(json.token("{},[], 123 \"34\" ")).toEqual([]);
    });
});