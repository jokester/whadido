/**
 * Generic parser combinator
 */

import { concatReducer } from './util';

/**
 * Type of all parsers:
 *
 * explicit Status generics (baastad paper used State = String, we may have other input type)
 */
type ParserOutput<State, Value> = {
  output: Value;
  rest: State;
}[];

export interface Parser<Status, Value> {
  (input: Status): ParserOutput<Status, Value>;
}

/**
 * unit :: a -> M a
 * consumes nothing and yields a
 */
export const unit: <S, A>(a: A) => Parser<S, A> = a => input => [{ output: a, rest: input }];

// unitM :: [a] -> M a
export const unitM: <S, A>(as: A[]) => Parser<S, A> = as => input => as.map(a => ({ output: a, rest: input }));

type IZero<S, A> = (input: S) => ParserOutput<S, A>;

// zero :: M a
export const zero: IZero<any, any> = input => [];

// bind: M a -> (a -> M b) -> M b
export const bind: <S, A, B>(m: Parser<S, A>, k: (a: A) => Parser<S, B>) => Parser<S, B> = (m, k) => input =>
  m(input)
    .map(mRet => k(mRet.output)(mRet.rest))
    .reduce(concatReducer, []);

// orMulti :: [M a] -> M a
export const orMulti: <S, A>(...ms: Parser<S, A>[]) => Parser<S, A> = (...ms) => input =>
  ms.map(m => m(input)).reduce(concatReducer, []);

export const or = orMulti;

// filter :: M a -> (a -> Bool) -> M a
export const filter: <S, A>(m: Parser<S, A>, predicate: (a: A) => boolean) => Parser<S, A> = (m, predicate) => input =>
  m(input).filter(mRet => predicate(mRet.output));

namespace Iterate {
  interface IterateType {
    <S, A>(m: Parser<S, A>): Parser<S, A[]>;
  }

  // iterate :: M a -> M [a]
  export const iterate: IterateType = <S, A>(m: Parser<S, A>) => {
    return or(bind(m, (a: A) => bind(iterate(m) as Parser<S, A[]>, (bs: A[]) => unit([a].concat(bs)))), unit([]));
  };

  interface Iterate1Type {
    <S, A>(m: Parser<S, A>, prev: ParserOutput<S, A[]>): ParserOutput<S, A[]>;
  }

  const iterate1: <S, A>(m: Parser<S, A>, prev: ParserOutput<S, A[]>) => ParserOutput<S, A[]> = (m, prev) =>
    prev.map(p => bind(m, a => unit(p.output.concat([a])))(p.rest)).reduce(concatReducer, []);

  // iterateN :: Int -> Int -> M a -> M [a]
  export const iterateN: (minCount: number, maxCount: number) => IterateType = (minCount: number, maxCount: number) => <
    S,
    A
  >(
    m: Parser<S, A>,
  ) => (input: S) => {
    let count = 0;
    const result: ParserOutput<S, A[]> = [];
    let temp: ParserOutput<S, A[]> = unit<S, A[]>([])(input);

    while (count <= maxCount) {
      if (minCount <= count) {
        result.push(...temp);
      }
      // run m for 1 more time
      temp = iterate1(m, temp);
      count++;
    }
    return result;
  };

  export const oneOrMany = iterateN(1, Number.MAX_SAFE_INTEGER);

  // reiterate :: M a -> M [a]
  // like iterate, but stop at first match
  export const reiterate: IterateType = <S, A>(m: Parser<S, A>) => {
    return biased<S, A[]>(
      bind<S, A, A[]>(m, (a: A) => bind<S, A[], A[]>(reiterate(m), (bs: A[]) => unit<S, A[]>([a].concat(bs)))),
      unit<S, A[]>([]),
    );
  };
}

export const { iterate, iterateN, reiterate } = Iterate;

// skip multiple m1 and return m2
export const skip = <S, A, B>(m1: Parser<S, A>, m2: Parser<S, B>) => {
  return bind(reiterate(m1), _ => m2);
};

// biasedM :: [M a] -> M a
export const biased: <S, A>(...ms: Parser<S, A>[]) => Parser<S, A> = (...ms) => input => {
  for (const m of ms) {
    if (!m) continue;
    const r = m(input);
    if (r.length) return r;
  }
  return [];
};

export const maybeDefault = <S, A>(absent: A, m: Parser<S, A>) => {
  return biased(m, unit<S, A>(absent));
};

export const maybe = <S, A>(m: Parser<S, A>) => maybeDefault(null, m);

export const seq2 = <S, A, B, C>(p1: Parser<S, A>, p2: Parser<S, B>, then: (a: A, b: B) => Parser<S, C>) => {
  return bind<S, A, C>(p1, a => bind<S, B, C>(p2, b => then(a, b)));
};

export const seq3: <S, A, B, C, D>(
  p1: Parser<S, A>,
  p2: Parser<S, B>,
  p3: Parser<S, C>,
  then: (a: A, b: B, c: C) => Parser<S, D>,
) => Parser<S, D> = (p1, p2, p3, then) => bind(p1, a => bind(p2, b => bind(p3, c => then(a, b, c))));

export const lookAhead: <S, A>(predicate: (inp: S) => boolean, p: Parser<S, A>) => Parser<S, A> = (
  predicate,
  p,
) => input => (predicate(input) ? p(input) : zero(input));
