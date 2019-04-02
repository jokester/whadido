import * as lodash from 'lodash';
import { Map as IMap, List as IList } from 'immutable';

import { Timestamp, RefLog, ParserPatterns } from '../git';

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

import { RefState, RefDump } from './ref-state';
import { RefParser, popReflog, b, u, setRest, allReflog } from './parser-primitives';
import { CONST } from './util';
import { createParsers } from './parsers';

export function topParser(state: RefState) {
  const subParsers = createParsers(state);

  const topParser: Parser<RefState, Op.Operation[]> = reiterate(
    biased(
      ...subParsers.remoteBranchUpdatedByPush,
      ...subParsers.remoteBranchUpdatedByFetch,
      ...subParsers.remoteBranchRenamed,
      subParsers.merge,
      subParsers.nonMergeCommit,
      ...subParsers.createBranch,
      subParsers.rebaseFinished,
      subParsers.rebaseInteractiveFinished,
      subParsers.rebaseInteractiveAborted,
      subParsers.reset,
      subParsers.checkout,
      subParsers.clone,
      subParsers.pull,
    ),
  );

  return topParser(state);
}
