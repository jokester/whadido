/**
 * A calculator language from `evaluator` example in baastad paper
 */

import {
    Parser, unit, zero, bind,
    filter, or, orMulti, skip, seq2, seq3,
    biased, iterate, iterateN, reiterate,

    skipWhitespace, beforeWhitespace, spaceDelimted,
    num, charLit, stringLit,
} from "./text";

const grammer = `

Expression := Int
              | '(' Expression ')'
              | Expression '/' Expression

       Int := [1-9][0-9]*

`;

const TypeAtom = "cons";
const TypeDiv = "div";

interface Expr {
    type: string;
}

interface AtomExpr extends Expr {
    type: typeof TypeAtom;
    val: number;
}

interface DivExpr extends Expr {
    type: typeof TypeDiv;
    nom: Expr;
    deno: Expr;
}

export const AtomParser = (bind(num, _ => unit<string, AtomExpr>({ type: TypeAtom, val: _ })));

export const ExpParser = skipWhitespace(seq3(
    charLit("("),
    AtomParser,
    skipWhitespace(charLit(")")),
    (a, b, c) => unit<string, AtomExpr>(b)));

export const DivParser = seq3(
    AtomParser,
    stringLit("/"),
    AtomParser,
    (a, b, c) => unit<string, DivExpr>({ type: TypeDiv, nom: a, deno: c }));
