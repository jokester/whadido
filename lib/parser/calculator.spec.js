"use strict";
/**
 * A calculator language from `evaluator` example in baastad paper
 */
Object.defineProperty(exports, "__esModule", { value: true });
const text_1 = require("./text");
var cal;
(function (cal) {
    const grammer = `

Expression := Int
              | '(' Expression ')'
              | Expression '/' Expression

       Int := [1-9][0-9]*

`;
    const TypeAtom = "cons";
    const TypeDiv = "div";
    cal.AtomParser = text_1.bind(text_1.num, _ => text_1.unit({ type: TypeAtom, val: _ }));
    cal.ExpParser = text_1.skipWhitespace(text_1.seq3(text_1.charLit("("), cal.AtomParser, text_1.skipWhitespace(text_1.charLit(")")), (a, b, c) => text_1.unit(b)));
    cal.DivParser = text_1.seq3(cal.AtomParser, text_1.stringLit("/"), cal.AtomParser, (a, b, c) => text_1.unit({ type: TypeDiv, nom: a, deno: c }));
})(cal || (cal = {}));
xdescribe("calculator", () => {
    it("parses atom value", () => {
        expect(cal.AtomParser("11 ")).toEqual([
            { output: { type: "cons", val: 11 }, rest: " " }
        ]);
        expect(cal.AtomParser(" 11   ")).toEqual([
            { output: { type: "cons", val: 11 }, rest: "   " }
        ]);
        expect(cal.AtomParser("11n")).toEqual([]);
    });
    it("parses atom value with parenthesis", () => {
        expect(cal.ExpParser(" ( 111 ) ")).toEqual([
            { output: { type: "cons", val: 111 }, rest: " " }
        ]);
    });
    it("parses div expression", () => {
        expect(cal.DivParser("111/")).toEqual([]);
    });
});
//# sourceMappingURL=calculator.spec.js.map