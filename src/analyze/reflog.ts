import { biased, Parser, reiterate } from '../parser';
import * as Op from './operations';

import { RefState } from './ref-state';
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
      ...subParsers.remoteOnlyPull,
    ),
  );

  return topParser(state);
}
