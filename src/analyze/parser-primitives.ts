import { RefState } from './ref-state';
import { Ref, RefLog } from '../git';
import { List as IList, Map as IMap } from 'immutable';

import {
  Parser,
  unit,
  zero,
  bind,
  lookAhead,
  filter,
  or,
  skip,
  seq2,
  seq3,
  biased,
  iterate,
  iterateN,
  reiterate,
  maybe,
  maybeDefault,
  unitM,
} from '../parser';
import * as Op from './operations';

export type RefParser<T> = Parser<RefState, T>;

// instantialized unit<S, A>
export function u(op: Op.Operation): RefParser<typeof op> {
  return unit(op);
}

export function setRest<T>(refpath: string, output: T, reflogs: IList<RefLog>): Parser<RefState, T> {
  return input => [{ output, rest: input.set(refpath, reflogs) }];
}

/**
 * bind (Parser Monad) specialized with {Input = RefState}
 */
export const b: <A, B>(m: Parser<RefState, A>, k: (a: A) => Parser<RefState, B>) => Parser<RefState, B> = bind;
/**
 * take last reflog of refPath
 * @param refPath
 */
export const popReflog: (refPath: string) => RefParser<RefLog> = refPath => input => {
  const l = input.get(refPath);
  if (l && l.size) {
    return [{ output: l.last(), rest: input.set(refPath, l.butLast()) }];
  }
  return [];
};

export const allReflog: (refPath: string) => RefParser<IList<RefLog>> = refPath => input => {
  if (input.has(refPath)) {
    return [{ output: input.get(refPath)!, rest: input.delete(refPath) }];
  }
  return [];
};
