/**
 * A calculator language from `evaluator` example in baastad paper
 */

import { bind, charLit, num, seq3, skipWhitespace, stringLit, unit } from './text';

namespace cal {
  const grammer = `

Expression := Int
              | '(' Expression ')'
              | Expression '/' Expression

       Int := [1-9][0-9]*

`;

  const TypeAtom = 'atom';
  const TypeDiv = 'div';

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

  export const AtomParser = bind(num, _ => unit<string, AtomExpr>({ type: TypeAtom, val: _ }));

  export const ExpParser = skipWhitespace(
    seq3(charLit('('), AtomParser, skipWhitespace(charLit(')')), (a, b, c) => unit<string, AtomExpr>(b)),
  );

  export const DivParser = seq3(AtomParser, stringLit('/'), AtomParser, (a, b, c) =>
    unit<string, DivExpr>({ type: TypeDiv, nom: a, deno: c }),
  );
}

function expectParseResult(parser: (expression: string) => unknown, parserName: string, expression: string) {
  expect(parser(expression)).toMatchSnapshot(`${parserName}(${JSON.stringify(expression)})`);
}

describe('calculator', () => {
  it('parses atom value', () => {
    for (const expression of ['11 ', '  11   ', '11n']) {
      expectParseResult(cal.AtomParser, 'cal.AtomParser', expression);
    }
  });

  it('parses atom value with parenthesis', () => {
    for (const expression of [' ( 111 ) ']) {
      expectParseResult(cal.ExpParser, 'cal.ExpParser', expression);
    }
  });

  it('parses div expression', () => {
    for (const expression of ['111/222', '111   /222', '111/', '/222 ']) {
      expectParseResult(cal.DivParser, 'cal.DivParser', expression);
    }
  });
});
