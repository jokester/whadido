import { List as IList } from 'immutable';
import { RefState } from './ref-state';
import { ParserPatterns, RefLog } from '../git';
import { allReflog, b, popReflog, setRest, u } from './parser-primitives';
import { biased, bind, filter, maybeDefault, Parser, unit, zero } from '../parser';
import * as Op from './operations';
import { operationFactory } from './operations';
import { CONST } from './util';
import * as lodash from 'lodash';

type OperationParser = Parser<RefState, Op.Operation>;
type OperationParserArray = OperationParser[];

export function createParsers(state: RefState) {
  const localBranches = Array.from(state.keys()).filter(refPath => ParserPatterns.refpath.localBranch.test(refPath));

  const popLocal = localBranches.map(branchName =>
    b(popReflog(branchName), branchLast => unit<RefState, BranchTip>([branchName, branchLast])),
  );

  const remoteBranches = Array.from(state.keys()).filter(refPath => ParserPatterns.refpath.remoteBranch.test(refPath));

  const popRemote = remoteBranches.map(branchName =>
    b(popReflog(branchName), branchLast => unit<RefState, BranchTip>([branchName, branchLast])),
  );

  const remoteBranchUpdatedByPush = popRemote.map(p =>
    b(p, ([branchPath, branchLast]) => {
      if (/^update by push/.exec(branchLast.desc)) {
        return u(operationFactory.push(branchPath, branchLast));
      }
      return zero;
    }),
  );

  /**
   * remote branch updated by fetch
   */
  const remoteBranchUpdatedByFetch = popRemote.map(p =>
    b(p, ([branchPath, branchLast]) => {
      if (/^fetch/.exec(branchLast.desc)) {
        return u(operationFactory.fetch(branchPath, branchLast));
      }
      return zero;
    }),
  );

  const remoteBranchRenamed = popRemote.map(p =>
    b(p, ([branchPath, branchLast]) => {
      if (/^remote: renamed /.exec(branchLast.desc)) {
        return u(operationFactory.renameRemote(branchPath, branchLast));
      }
      return zero;
    }),
  );

  const merge: OperationParser = b(headDesc(/^merge\W/), headLast =>
    biased(
      // some local branch contains a merge commit
      ...popLocal.map(p =>
        b(p, ([branchPath, branchLast]) => {
          if (sameDesc(headLast, branchLast) && sameTime(headLast, branchLast)) {
            return u(operationFactory.merge(headLast, branchPath, branchLast));
          }
          return zero;
        }),
      ),
      // no merge commit found (maybe fast-forward, or the ref got removed)
      u(operationFactory.merge(headLast, undefined, undefined)),
    ),
  );

  const nonMergeCommit: OperationParser = b(headDesc(/^commit\W/), headLast =>
    biased(
      // 1 head + 1 branch
      ...popLocal.map(p =>
        b(p, ([branchPath, branchLast]) => {
          if (sameDesc(headLast, branchLast) && sameTime(headLast, branchLast)) {
            return u(operationFactory.commit(headLast, branchPath, branchLast));
          }
          return zero;
        }),
      ),
      // head only
      u(operationFactory.commit(headLast, undefined, undefined)),
    ),
  );

  const createBranch: OperationParserArray = popLocal.map(p =>
    b(filter(p, branchCreate), ([branchPath, branchLast]) =>
      biased(
        // checkout -b
        b(headDesc(/^checkout:/), (headLast: RefLog) => {
          if (sameTime(headLast, branchLast) && sameDest(headLast, branchLast)) {
            return u(operationFactory.createBranch(branchLast, branchPath, headLast));
          }
          return zero;
        }),
        // create w/o checkout
        u(operationFactory.createBranch(branchLast, branchPath, undefined)),
      ),
    ),
  );

  // rebase (finished)
  const rebaseFinished: OperationParser = b(headRebaseFinished, (headReflogs: IList<RefLog>) =>
    biased(
      ...popLocal.map(p =>
        bind<RefState, BranchTip, Op.Operation>(p, ([branchPath, branchLast]) => {
          if (
            headReflogs.first<RefLog>().from === branchLast.from &&
            headReflogs.last<RefLog>().to === branchLast.to &&
            RebaseDesc.finishBranch.exec(branchLast.desc)
          ) {
            return u(operationFactory.rebaseFinished(headReflogs.toJS(), branchPath, branchLast));
          }
          return zero;
        }),
      ),
      u(operationFactory.rebaseFinished(headReflogs.toJS(), undefined, undefined)),
    ),
  );

  const rebaseInteractiveFinished: OperationParser = b(headRebaseInteractiveFinished, headReflogs =>
    biased(
      ...popLocal.map(p =>
        bind<RefState, BranchTip, Op.Operation>(p, ([branchPath, branchLast]) => {
          if (
            headReflogs.first<RefLog>().from === branchLast.from &&
            headReflogs.last<RefLog>().to === branchLast.to &&
            RebaseDesc.iFinish.exec(branchLast.desc)
          ) {
            return u(operationFactory.rebaseInteractiveFinished(headReflogs.toJS(), branchPath, branchLast));
          }
          return zero;
        }),
      ),
      u(operationFactory.rebaseInteractiveFinished(headReflogs.toJS(), undefined, undefined)),
    ),
  );

  // TODO: rebase (noninteractive, aborted)

  // rebase -i (abort)
  const rebaseInteractiveAborted = b(headRebaseInteractiveAborted, headReflogs =>
    u(operationFactory.rebaseInteractiveAborted(headReflogs.toJS())),
  );

  // reset
  const reset = b(headDesc(/^reset:/), (headLast: RefLog) =>
    biased(
      // 1 head + 1 branch
      ...popLocal.map(p =>
        b(p, ([branchName, branchLast]) => {
          if (sameDesc(headLast, branchLast) && sameTime(headLast, branchLast)) {
            return u(operationFactory.reset(headLast, branchName, branchLast));
          }
          return zero;
        }),
      ),
      // head only (if the branch is removed)
      u(operationFactory.reset(headLast, undefined, undefined)),
    ),
  );

  const checkout = b(headDesc(/^checkout:/), (headTop: RefLog) => u(operationFactory.checkout(headTop)));

  const clone = b(headDesc(/clone:/), (headLast: RefLog) =>
    biased(
      // 1 head + 1 branch
      ...popLocal.map(p =>
        b(p, ([branchName, branchLast]) => {
          if (sameDesc(headLast, branchLast) && sameTime(headLast, branchLast)) {
            return u(operationFactory.clone(headLast, branchName, branchLast));
          }
          return zero;
        }),
      ),
      u(operationFactory.clone(headLast, undefined, undefined)),
    ),
  );

  const pull = b(headDesc(/^pull:/), (headLast: RefLog) =>
    b(
      maybeDefault<RefState, BranchTip>(
        [null!, null!],
        biased<RefState, BranchTip>(
          ...popLocal.map(p =>
            bind<RefState, BranchTip, BranchTip>(p, ([localBranchName, localLast]) => {
              if (sameDesc(headLast, localLast) && sameTime(headLast, localLast)) {
                return unit<RefState, BranchTip>([localBranchName, localLast]);
              }
              return zero;
            }),
          ),
        ),
      ),
      ([localBranchName, localLast]) =>
        b(
          maybeDefault<RefState, BranchTip>(
            [null!, null!],
            biased<RefState, BranchTip>(
              ...popRemote.map(p =>
                bind<RefState, BranchTip, BranchTip>(p, ([remoteBranchName, remoteLast]) => {
                  if (sameDesc(headLast, remoteLast, true) && sameTime(headLast, remoteLast)) {
                    return unit<RefState, BranchTip>([remoteBranchName, remoteLast]);
                  }
                  return zero;
                }),
              ),
            ),
          ),
          ([remoteBranchName, remoteBranchLast]) => u(operationFactory.pull(headLast)),
        ),
    ),
  );

  return {
    remoteBranchUpdatedByPush,
    remoteBranchUpdatedByFetch,
    remoteBranchRenamed,
    merge,
    nonMergeCommit,
    createBranch,
    rebaseFinished,
    rebaseInteractiveFinished,
    rebaseInteractiveAborted,
    reset,
    checkout,
    clone,
    pull,
  };
}

type BranchTip = [string, RefLog];

function headDesc(regex: RegExp) {
  return filter(popReflog(CONST.HEAD), headLast => regex.test(headLast.desc));
}

function sameDesc(l1: RefLog, l2: RefLog, ignoreCase = false) {
  return l1 && l2 && (ignoreCase ? l1.desc.toLowerCase() === l2.desc.toLowerCase() : l1.desc === l2.desc);
}

function sameTime(l1: RefLog, l2: RefLog) {
  return l1 && l2 && lodash.isEqual(l1.at, l2.at);
}

function sameDest(l1: RefLog, l2: RefLog) {
  return l1 && l2 && l1.to === l2.to;
}

const branchCreate = ([branchName, branchLast]: BranchTip) => /^branch: Created from/.test(branchLast.desc);

const RebaseDesc = {
  iFinish: /^rebase -i \(finish\):/,
  i: /^rebase -i \(/,
  iStart: /^rebase -i \(start\):/,
  iAbort: /^rebase -i \(abort\):/,

  checkout: /^rebase: checkout /,
  inProgress: /^rebase\W/,
  finishHead: /^rebase finished: returning to /,
  finishBranch: /rebase finished: /,

  aborting: 'rebase: aborting',
};

const headRebaseFinished = b(allReflog(CONST.HEAD), reflogs => {
  type Rest = Parser<RefState, IList<RefLog>>;
  const z: Rest = zero;
  if (reflogs.size < 2) {
    return z;
  }
  if (!RebaseDesc.finishHead.exec(reflogs.last<RefLog>().desc)) {
    return z;
  }
  let r: RefLog;
  for (let consumed = 1; consumed <= reflogs.size; consumed++) {
    r = reflogs.get(reflogs.size - consumed)!;
    if (!RebaseDesc.inProgress.exec(r.desc)) {
      return z;
    }
    if (RebaseDesc.checkout.exec(r.desc)) {
      return setRest<IList<RefLog>>(
        CONST.HEAD,
        reflogs.skip(reflogs.size - consumed),
        reflogs.take(reflogs.size - consumed),
      );
    }
  }
  return z;
});

/**
 * rebase (interactive) in head:
 *
 */
const headRebaseInteractiveFinished = b(allReflog(CONST.HEAD), headReflogs => {
  const z: Parser<RefState, IList<RefLog>> = zero;
  if (headReflogs.size < 2) {
    return z;
  }
  if (!RebaseDesc.iFinish.exec(headReflogs.last<RefLog>().desc)) {
    return z;
  }
  let r: RefLog;
  for (let consumed = 1; consumed <= headReflogs.size; consumed++) {
    r = headReflogs.get(headReflogs.size - consumed)!;
    if (!RebaseDesc.i.exec(r.desc)) {
      return z;
    }
    if (RebaseDesc.iStart.exec(r.desc)) {
      return setRest<IList<RefLog>>(
        CONST.HEAD,
        headReflogs.skip(headReflogs.size - consumed),
        headReflogs.take(headReflogs.size - consumed),
      );
    }
  }
  return z;
});

const headRebaseInteractiveAborted = b(allReflog(CONST.HEAD), reflogs => {
  type Rest = Parser<RefState, IList<RefLog>>;
  const z: Rest = zero;
  if (reflogs.size < 2) {
    return z;
  }
  let r: RefLog;
  for (let consumed = 1; consumed <= reflogs.size; consumed++) {
    r = reflogs.get(reflogs.size - consumed)!;
    // last item must be ""
    if (consumed === 1 && !RebaseDesc.iAbort.exec(r.desc)) {
      return z;
    }
    // last but 1 item must be "rebase: aborting"
    if (consumed === 2 && RebaseDesc.aborting !== r.desc) {
      return z;
    }
    // take until "rebase -i (start)"
    if (RebaseDesc.iStart.exec(r.desc)) {
      return setRest<IList<RefLog>>(
        CONST.HEAD,
        reflogs.skip(reflogs.size - consumed),
        reflogs.take(reflogs.size - consumed),
      );
    }
  }
  return z;
});

const branchWithSameTip: (tip: RefLog) => Parser<RefState, string> = tip => input => {
  for (const [refPath, refLogs] of input) {
    const t = refLogs.last();
    if (lodash.isEqual(t, tip)) {
      return unit(refPath)(input);
    }
  }
  return zero(input);
};
