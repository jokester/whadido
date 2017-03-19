"use strict";
/**
 * A calculator language from `evaluator` example in baastad paper
 */
Object.defineProperty(exports, "__esModule", { value: true });
const text_1 = require("./text");
var TokenType;
(function (TokenType) {
    TokenType[TokenType["lp"] = "LP"] = "lp";
    TokenType[TokenType["rp"] = "RP"] = "rp";
    TokenType[TokenType["comma"] = "COMMA"] = "comma";
    TokenType[TokenType["str"] = "STR"] = "str";
    TokenType[TokenType["num"] = "NUM"] = "num";
    TokenType[TokenType["lb"] = "LB"] = "lb";
    TokenType[TokenType["rb"] = "RB"] = "rb";
    TokenType[TokenType["eof"] = "EOF"] = "eof";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
// const token = (type: TokenType, raw: string) => ({ type, raw } as Token);
exports.createLiteralParser = (lit, type) => text_1.bind(text_1.skipWhitespace(text_1.stringLit(lit)), v => text_1.unit({ type: type, raw: lit }));
const lp = exports.createLiteralParser("{", TokenType.lp);
const rp = exports.createLiteralParser("}", TokenType.rp);
const comma = exports.createLiteralParser(",", TokenType.comma);
const lb = exports.createLiteralParser("[", TokenType.lb);
const rb = exports.createLiteralParser("]", TokenType.rb);
const num = text_1.bind(text_1.skipWhitespace(text_1.num), n => text_1.unit({ type: TokenType.num, raw: n }));
const str = text_1.seq3(text_1.skipWhitespace(text_1.charLit("\"")), text_1.reiterate(text_1.filter(text_1.getChar, c => c !== "\"")), text_1.charLit("\""), (a, b, c) => ({ raw: b.join(""), type: TokenType.str }));
const eof = text_1.bind(text_1.skipWhitespace(text_1.eof), _ => text_1.unit({ type: TokenType.eof, raw: "" }));
exports.token = text_1.seq2(text_1.reiterate(text_1.or(lp, rp, comma, lb, rb, num, str)), eof, (tokens, _) => tokens);
//# sourceMappingURL=json.js.map