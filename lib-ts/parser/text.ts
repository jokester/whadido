/**
 * Parser for text
 */

import {
    Parser, unit, zero, bind,
    filter, or, orMulti, skip, seq2, seq3,
    biased, iterate, iterateN, reiterate,
} from "./combinator";

export {
    Parser, unit, zero, bind,
    filter, or, orMulti, skip, seq2, seq3,
    biased, iterate, iterateN, reiterate,
} from "./combinator";

export const getChar: Parser<string, string> = (input) => {
    if (typeof input === "string" && input.length)
        return [{
            output: input.charAt(0),
            rest: input.substr(1)
        }];
    else
        return [];
};

export const isLetter = (a: string) => a && a.length === 1 && !!/[a-zA-Z]/.exec(a);
export const isDigit = (a: string) => a && a.length === 1 && !!/[0-9]/.exec(a);
export const charLit = (a: string) => filter(getChar, _ => a === _);

export const stringLit = (a: string) => <Parser<string, string>>((input: string) => input.startsWith(a) ? [{ output: a, rest: input.slice(a.length) }] : []);

export const isWhitespace = (a: string) => a === "\r" || a === "\n" || a === " " || a === "\t";

export const whitespace = filter(getChar, isWhitespace);

export const skipWhitespace = <A>(m: Parser<string, A>) => skip(whitespace, m);

export const digit: Parser<string, string> = filter(getChar, isDigit);

export const word = bind<string, string[], string>(
    reiterate(filter(getChar, isLetter)),
    _ => unit<string, string>(_.join("")));

export const num: Parser<string, number> = bind(
    reiterate(digit), (digits) => digits.length ? unit<string, number>(parseInt(digits.join(""))) : zero);

export const beforeWhitespace: <A>(m: Parser<string, A>) => typeof m = <A>(m: Parser<string, A>) => {
    return bind(m, m1 => rest => /* lookahead: return m1 only if rest is empty or starts with whitespace */
        /^[ \r\n\t]|^$/.exec(rest) ? unit(m1)(rest) : zero(rest));
};

export const spaceDelimted = <A>(m: Parser<string, A>) => beforeWhitespace(skipWhitespace(m));

export const rest: Parser<string, string> = (input: string) => [{ output: input, rest: "" }];

export const eof: Parser<string, symbol> = (input: string) => input.length ? [] : [{ output: EOF, rest: undefined }];
export const EOF = Symbol("EOF");
