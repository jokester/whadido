"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json = require("./json");
xdescribe("json parser", () => {
    it("parses token", () => {
        expect(json.token("{},[], 123 \"34\" ")).toEqual([]);
    });
});
//# sourceMappingURL=json.spec.js.map