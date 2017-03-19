"use strict";
/**
 * A calculator language from `evaluator` example in baastad paper
 */
Object.defineProperty(exports, "__esModule", { value: true });
const text_1 = require("./text");
const grammer = `

Expression := Int
              | '(' Expression ')'
              | Expression '/' Expression

       Int := [1-9][0-9]*

`;
const TypeAtom = "cons";
const TypeDiv = "div";
exports.AtomParser = (text_1.bind(text_1.num, _ => text_1.unit({ type: TypeAtom, val: _ })));
exports.ExpParser = text_1.skipWhitespace(text_1.seq3(text_1.charLit("("), exports.AtomParser, text_1.skipWhitespace(text_1.charLit(")")), (a, b, c) => b));
exports.DivParser = text_1.seq3(exports.AtomParser, text_1.stringLit("/"), exports.AtomParser, (a, b, c) => ({ type: TypeDiv, nom: a, deno: c }));
//# sourceMappingURL=calculator.js.map