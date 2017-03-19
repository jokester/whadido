"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cal = require("./calculator");
xdescribe("calculator", () => {
    it("parses atom value", () => {
        expect(cal.AtomParser("11 "))
            .toEqual([{ output: { type: "cons", val: 11 }, rest: " " }]);
        expect(cal.AtomParser(" 11   "))
            .toEqual([{ output: { type: "cons", val: 11 }, rest: "   " }]);
        expect(cal.AtomParser("11n")).toEqual([]);
    });
    it("parses atom value with parenthesis", () => {
        expect(cal.ExpParser(" ( 111 ) ")).toEqual([
            { output: { type: "cons", val: 111 }, rest: " " }
        ]);
    });
    it("parses div expression", () => {
        expect(cal.DivParser("111/"))
            .toEqual([]);
    });
});
//# sourceMappingURL=calculator.spec.js.map