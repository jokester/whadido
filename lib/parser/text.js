"use strict";
/**
 * Parser for text
 */
Object.defineProperty(exports, "__esModule", { value: true });
const combinator_1 = require("./combinator");
var combinator_2 = require("./combinator");
exports.unit = combinator_2.unit;
exports.zero = combinator_2.zero;
exports.bind = combinator_2.bind;
exports.filter = combinator_2.filter;
exports.or = combinator_2.or;
exports.orMulti = combinator_2.orMulti;
exports.skip = combinator_2.skip;
exports.seq2 = combinator_2.seq2;
exports.seq3 = combinator_2.seq3;
exports.biased = combinator_2.biased;
exports.iterate = combinator_2.iterate;
exports.iterateN = combinator_2.iterateN;
exports.reiterate = combinator_2.reiterate;
exports.getChar = (input) => {
    if (typeof input === "string" && input.length)
        return [{
                output: input.charAt(0),
                rest: input.substr(1)
            }];
    else
        return [];
};
exports.isLetter = (a) => a && a.length === 1 && !!/[a-zA-Z]/.exec(a);
exports.isDigit = (a) => a && a.length === 1 && !!/[0-9]/.exec(a);
exports.charLit = (a) => combinator_1.filter(exports.getChar, _ => a === _);
exports.stringLit = (a) => ((input) => input.startsWith(a) ? [{ output: a, rest: input.slice(a.length) }] : []);
exports.isWhitespace = (a) => a === "\r" || a === "\n" || a === " " || a === "\t";
exports.whitespace = combinator_1.filter(exports.getChar, exports.isWhitespace);
exports.skipWhitespace = (m) => combinator_1.skip(exports.whitespace, m);
exports.digit = combinator_1.filter(exports.getChar, exports.isDigit);
exports.word = combinator_1.bind(combinator_1.reiterate(combinator_1.filter(exports.getChar, exports.isLetter)), _ => combinator_1.unit(_.join("")));
exports.num = combinator_1.bind(combinator_1.reiterate(exports.digit), (digits) => digits.length ? combinator_1.unit(parseInt(digits.join(""))) : combinator_1.zero);
exports.beforeWhitespace = (m) => {
    return combinator_1.bind(m, (m1) => (rest) => /* lookahead: return m1 only if rest is empty or starts with whitespace */ /^[ \r\n\t]|^$/.exec(rest) ? combinator_1.unit(m1)(rest) : combinator_1.zero(rest));
};
exports.spaceDelimted = (m) => exports.beforeWhitespace(exports.skipWhitespace(m));
exports.rest = (input) => [{ output: input, rest: "" }];
exports.eof = (input) => input.length ? [] : [{ output: exports.EOF, rest: undefined }];
exports.EOF = Symbol("EOF");
//# sourceMappingURL=text.js.map