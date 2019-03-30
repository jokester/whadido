import { concatReducer } from './util';
import * as combinator from './combinator';
import * as text from './text';

describe('util.ts', () => {
  it('concats value', () => {
    expect([[1, 2, 3], [2, 4]].reduce(concatReducer)).toEqual([1, 2, 3, 2, 4]);
    expect([[1, 2, 3], [2, 4]].reduce(concatReducer, [])).toEqual([1, 2, 3, 2, 4]);
    expect([[1, 2, 3], [2, 4]].reduce(concatReducer, [])).toEqual([1, 2, 3, 2, 4]);
  });
});

describe('combinator.ts', () => {
  it('unit()', () => {
    expect(combinator.unit('a')('bbb')).toEqual([{ output: 'a', rest: 'bbb' }]);
  });

  it('getChar()', () => {
    expect(text.getChar('')).toEqual([]);
  });

  it('bind()', () => {
    const char2 = (c1: string) => (rest: string) => (c1 === 'x' ? [{ rest, output: { char: c1, num: 123 } }] : []);
    expect(combinator.bind(text.getChar, char2)('x1')).toEqual([{ output: { char: 'x', num: 123 }, rest: '1' }]);

    expect(combinator.bind(text.getChar, _ => combinator.zero)('222')).toEqual([]);
  });

  it('or() and filter()', () => {
    const char2 = combinator.unit<string, string>('hey');
    expect(combinator.or(text.getChar, char2)('mmm')).toEqual([
      { output: 'm', rest: 'mm' },
      { output: 'hey', rest: 'mmm' },
    ]);

    expect(combinator.or(text.getChar, combinator.filter(char2, _ => false))('mmm')).toEqual([
      { output: 'm', rest: 'mm' },
    ]);
  });

  it('iterate()', () => {
    expect(combinator.iterate(text.getChar)('abc')).toEqual([
      { output: ['a', 'b', 'c'], rest: '' },
      { output: ['a', 'b'], rest: 'c' },
      { output: ['a'], rest: 'bc' },
      { output: [], rest: 'abc' },
    ]);

    expect(combinator.iterate(combinator.filter(text.getChar, text.isDigit))('12a')).toEqual([
      { output: ['1', '2'], rest: 'a' },
      { output: ['1'], rest: '2a' },
      { output: [], rest: '12a' },
    ]);
  });

  it('iterateN()', () => {
    expect(combinator.iterateN(2, 3)(text.getChar)('123')).toEqual([
      { output: ['1', '2'], rest: '3' },
      { output: ['1', '2', '3'], rest: '' },
    ]);
  });

  it('lookAhead', () => {
    expect(combinator.lookAhead((s: string) => s.startsWith('123'), text.getChar)('123')).toEqual([
      { output: '1', rest: '23' },
    ]);

    expect(combinator.lookAhead((s: string) => s.startsWith('123'), text.getChar)('124')).toEqual([]);
  });

  it('biased() / reiterate', () => {
    expect(combinator.reiterate(combinator.filter(text.getChar, text.isDigit))('12 a')).toEqual([
      { output: ['1', '2'], rest: ' a' },
    ]);
  });
});

describe('text.ts', () => {
  it('charLit()', () => {
    expect(text.charLit('a')('b')).toEqual([]);
    expect(text.charLit('a')('ac')).toEqual([{ output: 'a', rest: 'c' }]);
  });

  it('stringLit', () => {
    expect(text.stringLit('aaab')('aaabC')).toEqual([{ output: 'aaab', rest: 'C' }]);
    expect(text.stringLit('aaab')('aaa bC')).toEqual([]);
  });

  it('getNumber', () => {
    expect(text.num('111a')).toEqual([{ output: 111, rest: 'a' }]);

    expect(text.spaceDelimited(text.num)('111a')).toEqual([]);
  });

  it('skip', () => {
    expect(text.reiterate(text.whitespace)('\t\r\n a')).toEqual([{ output: ['\t', '\r', '\n', ' '], rest: 'a' }]);

    expect(text.bind(text.reiterate(text.whitespace), _ => text.num)(' 1234 ')).toEqual([{ output: 1234, rest: ' ' }]);

    expect(text.skipWhitespace(text.num)('  1234N')).toEqual([{ output: 1234, rest: 'N' }]);
  });

  it('seq2', () => {
    expect(text.seq2(text.word, text.num, (w, n) => combinator.unit(`w=${w}/n=${n}`))('www123')).toEqual([
      { output: `w=www/n=123`, rest: '' },
    ]);
    expect(text.seq2(text.word, text.num, (w, n) => combinator.unit(`w=${w}/n=${n}`))('www 123')).toEqual([]);
  });
});
