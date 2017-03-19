/**
 * A calculator language from `evaluator` example in baastad paper
 */

import {
    Parser, unit, zero, bind,
    filter, or, orMulti, skip, seq2, seq3,
    biased, iterate, iterateN, reiterate,

    skipWhitespace, beforeWhitespace, spaceDelimted,
    num as $num, charLit, stringLit, getChar, eof as $eof,
} from "./text";

export enum TokenType {
    lp = <any>"LP",     // {
    rp = <any>"RP",     // }
    comma = <any>"COMMA",  // ,
    str = <any>"STR", // "",
    num = <any>"NUM", // 1,
    lb = <any>"LB",     // [,
    rb = <any>"RB",     // ],
    eof = <any>"EOF",
}

export interface Token {
    type: TokenType;
    raw: string | number;
}

// const token = (type: TokenType, raw: string) => ({ type, raw } as Token);

export const createLiteralParser = (lit: string, type: TokenType) => bind(
    skipWhitespace(stringLit(lit)),
    v => unit<string, Token>({ type: type, raw: lit }));

const lp = createLiteralParser("{", TokenType.lp);
const rp = createLiteralParser("}", TokenType.rp);
const comma = createLiteralParser(",", TokenType.comma);
const lb = createLiteralParser("[", TokenType.lb);
const rb = createLiteralParser("]", TokenType.rb);
const num = bind(skipWhitespace($num), n => unit<string, Token>({ type: TokenType.num, raw: n }));
const str = seq3(
    skipWhitespace(charLit("\"")),
    reiterate(filter(getChar, c => c !== "\"")),
    charLit("\""),
    (a, b, c) => ({ raw: b.join(""), type: TokenType.str })
);

const eof = bind(skipWhitespace($eof), _ => unit<string, Token>({ type: TokenType.eof, raw: "" }));

export const token = seq2(
    reiterate(or(
        lp,
        rp,
        comma,
        lb,
        rb,
        num,
        str,
    )),
    eof,
    (tokens, _) => tokens);

