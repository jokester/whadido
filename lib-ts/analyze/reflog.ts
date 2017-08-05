import * as lodash from "lodash";
import { Map as IMap, List as IList } from "immutable";

import {
    detectRefpath, Timestamp, RefLog, CONST, git_parser
} from "../git";
import * as Op from "./operations";

import {
    Parser, unit, zero, IZero, bind, bind as ᐅ,
    lookAhead, filter, or, skip, seq2, seq3,
    biased, iterate, iterateN, reiterate, maybe, maybeDefault,
    unitM,
} from "../parser";

import { RefState, RefParser, RefDump } from "./";

// instantialized unit<S, A>
function u(op: Op.Operation) {
    return unit(op) as RefParser<typeof op>;
}

function setRest<T>(refpath: string, output: T, reflogs: IList<RefLog>) {
    return <Parser<RefState, T>>((input) => [{ output, rest: input.set(refpath, reflogs) }]);
}

const b = bind as {
    <A, B>(m: Parser<RefState, A>,
        k: (a: A) => Parser<RefState, B>): Parser<RefState, B>;
};

type BranchTip = [string, RefLog];

/**
 * take last reflog of refpath
 * @param refpath
 */
const popReflog = (refpath: string) => <RefParser<RefLog>>((input: RefState) => {
    const l = input.get(refpath);
    if (l && l.size)
        return [{ output: l.last(), rest: input.set(refpath, l.butLast()) }];
    return [];
});

const allReflog = (refpath: string) => <RefParser<IList<RefLog>>>((input: RefState) => {
    if (input.has(refpath)) {
        return [{ output: input.get(refpath), rest: input.delete(refpath) }];
    }
    return [];
});

const popHead = popReflog(CONST.HEAD);

export function topParser(state: RefState) {

    const localBranches = Array.from(state.keys())
        .filter(refpath => detectRefpath.local_branch.exec(refpath));

    const remoteBranches = Array.from(state.keys())
        .filter(refpath => detectRefpath.remote_branch.exec(refpath));

    const popRemote = remoteBranches.map(
        branchName => b(popReflog(branchName),
            branchLast => unit<RefState, BranchTip>([branchName, branchLast])));

    const popLocal = localBranches.map(
        branchName => b(popReflog(branchName),
            branchLast => unit<RefState, BranchTip>([branchName, branchLast])));

    const parser: Parser<RefState, Op.Operation[]> = reiterate(biased<RefState, Op.Operation>(

        ...popRemote.map(p => b(p, ([branchpath, branchLast]) => {
            if (/^update by push/.exec(branchLast.desc))
                return u(new Op.Push(branchpath, branchLast));
            return zero;
        })),

        ...popRemote.map(p => b(p, ([branchpath, branchLast]) => {
            if (/^fetch/.exec(branchLast.desc))
                return u(new Op.Fetch(branchpath, branchLast));
            return zero;
        })),

        ...popRemote.map(p => b(p, ([branchpath, branchLast]) => {
            if (/^remote: renamed /.exec(branchLast.desc))
                return u(new Op.RenameRemote(branchpath, branchLast));
            return zero;
        })),

        // merge
        b(headMerge, headLast => biased(
            // 1 head + 1 branch
            ...popLocal.map(p => b(p, ([branchPath, branchLast]) => {
                if (sameDesc(headLast, branchLast) && sameTime(headLast, branchLast)) {
                    return u(new Op.Merge(headLast, branchPath, branchLast));
                }
                return zero;
            })),
            // head only
            u(new Op.Merge(headLast, null, null)))),

        // commit
        b(headCommit, headLast => biased(
            // 1 head + 1 branch
            ...popLocal.map(p => b(p, ([branchPath, branchLast]) => {
                if (sameDesc(headLast, branchLast) && sameTime(headLast, branchLast)) {
                    return u(new Op.Commit(headLast, branchPath, branchLast));
                }
                return zero;
            })),
            // head only
            u(new Op.Commit(headLast)))),

        // create + checkout
        ...popLocal.map(p => b(filter(p, branchCreate), ([branchPath, branchLast]) => biased(
            b(headCheckout, headLast => {
                const branch = git_parser.extractLocalBranch(branchPath);
                if (sameTime(headLast, branchLast)
                    && sameDest(headLast, branchLast)) {
                    return u(new Op.CreateBranch(branchLast, branchPath, headLast));
                }
                return zero;
            }),
            // create w/o checkout
            u(new Op.CreateBranch(branchLast, branchPath, null)),
        ))),

        // rebase (finished)
        b(headRebaseFinished, (headReflogs) => biased(
            ...popLocal.map(p => bind<RefState, BranchTip, Op.Operation>(p, ([branchPath, branchLast]) => {
                if (headReflogs.first().from === branchLast.from
                    && headReflogs.last().to === branchLast.to
                    && RebaseDesc.finishBranch.exec(branchLast.desc))
                    return u(new Op.RebaseFinished(headReflogs.toJS(), branchPath, branchLast));
                return zero;
            })),
            u(new Op.RebaseFinished(headReflogs.toJS())))),

        // rebase -i (finished)
        b(headRebaseInteractiveFinished, headReflogs => biased(
            ...popLocal.map(p => bind<RefState, BranchTip, Op.Operation>(p, ([branchPath, branchLast]) => {
                if (headReflogs.first().from === branchLast.from
                    && headReflogs.last().to === branchLast.to
                    && RebaseDesc.iFinish.exec(branchLast.desc))
                    return u(new Op.RebaseInteractiveFinished(headReflogs.toJS(), branchPath, branchLast));
                return zero;
            })),
            u(new Op.RebaseInteractiveFinished(headReflogs.toJS())))),

        // rebase -i (abort)
        b(headRebaseInteractiveAborted,
            headReflogs => u(new Op.RebaseInteractiveAborted(headReflogs.toJS()))),

        // reset
        b(headReset, headLast => biased(
            // 1 head + 1 branch
            ...popLocal.map(p => b(p, ([branchName, branchLast]) => {
                if (sameDesc(headLast, branchLast) && sameTime(headLast, branchLast)) {
                    return u(new Op.Reset(headLast, branchName, branchLast));
                }
                return zero;
            })),
            // head only
            u(new Op.Reset(headLast))),
        ),

        // checkout only
        b(headCheckout, headTop => u(new Op.Checkout(headTop))),

        // clone
        b(headClone, headLast => biased(
            // 1 head + 1 branch
            ...popLocal.map(p => b(p, ([branchName, branchLast]) => {
                if (sameDesc(headLast, branchLast) && sameTime(headLast, branchLast)) {
                    return u(new Op.Clone(headLast, branchName, branchLast));
                }
                return zero;
            })),
            u(new Op.Clone(headLast)))),

        // pull: 1 head + 1/0 local branch + 1/0 remote branch
        b(headPull, headLast => b(
            maybeDefault<RefState, BranchTip>([null, null], biased<RefState, BranchTip>(
                ...popLocal.map(p => bind<RefState, BranchTip, BranchTip>(
                    p, ([localBranchName, localLast]) => {
                        if (sameDesc(headLast, localLast) && sameTime(headLast, localLast))
                            return unit<RefState, BranchTip>([localBranchName, localLast]);
                        return zero;
                    })),
            )),
            ([localBranchName, localLast]) => b(
                maybeDefault<RefState, BranchTip>([null, null], biased<RefState, BranchTip>(
                    ...popRemote.map(p => bind<RefState, BranchTip, BranchTip>(
                        p, ([remoteBranchName, remoteLast]) => {
                            if (sameDesc(headLast, remoteLast, true) && sameTime(headLast, remoteLast))
                                return unit<RefState, BranchTip>([remoteBranchName, remoteLast]);
                            return zero;
                        })))),
                ([remoteBranchName, remoteBranchLast]) => u(new Op.Pull(headLast)))))
    ));


    return parser(state);
}

function sameDesc(l1: RefLog, l2: RefLog, ignoreCase = false) {
    return l1 && l2 &&
        (ignoreCase ? (l1.desc.toLowerCase() === l2.desc.toLowerCase()) : l1.desc === l2.desc);
}

function sameTime(l1: RefLog, l2: RefLog) {
    return l1 && l2 && lodash.isEqual(l1.at, l2.at);
}

function sameDest(l1: RefLog, l2: RefLog) {
    return l1 && l2 && l1.to === l2.to;
}

const headCheckout = filter(popReflog(CONST.HEAD),
    headLast => /^checkout:/.exec(headLast.desc));

const headReset = filter(popReflog(CONST.HEAD),
    headLast => /^reset:/.exec(headLast.desc));

const headMerge = filter(popReflog(CONST.HEAD),
    headLast => /^merge\W/.exec(headLast.desc));

const headCommit = filter(popReflog(CONST.HEAD),
    headLast => /^commit( \((amend|merge)\))?:/.exec(headLast.desc));

const headClone = filter(popReflog(CONST.HEAD),
    headLast => /^clone: from /.exec(headLast.desc));

const headPull = filter(popReflog(CONST.HEAD),
    headLast => /^pull: /.exec(headLast.desc));

const RebaseDesc = {
    iFinish: /^rebase -i \(finish\):/,
    i: /^rebase -i \(/,
    iStart: /^rebase -i \(start\):/,
    iAbort: /^rebase -i \(abort\):/,

    checkout: /^rebase: checkout /,
    inProgress: /^rebase\W/,
    finishHead: /^rebase finished: returning to /,
    finishBranch: /rebase finished: /,

    aborting: "rebase: aborting",
};

const headRebaseFinished = b(
    allReflog(CONST.HEAD),
    reflogs => {
        type Rest = Parser<RefState, IList<RefLog>>;
        const z = <Rest>zero;
        if (reflogs.size < 2)
            return z;
        if (!RebaseDesc.finishHead.exec(reflogs.last().desc))
            return z;
        let r: RefLog, consumed = 1;
        for (let consumed = 1; consumed <= reflogs.size; consumed++) {
            r = reflogs.get(reflogs.size - consumed);
            if (!RebaseDesc.inProgress.exec(r.desc))
                return z;
            if (RebaseDesc.checkout.exec(r.desc))
                return <Rest>setRest<IList<RefLog>>(CONST.HEAD,
                    reflogs.skip(reflogs.size - consumed),
                    reflogs.take(reflogs.size - consumed));
        }
        return z;
    });

const headRebaseInteractiveFinished = b(
    allReflog(CONST.HEAD),
    reflogs => {
        type Rest = Parser<RefState, IList<RefLog>>;
        const z = <Rest>zero;
        if (reflogs.size < 2)
            return z;
        if (!RebaseDesc.iFinish.exec(reflogs.last().desc))
            return z;
        let r: RefLog, consumed = 1;
        for (let consumed = 1; consumed <= reflogs.size; consumed++) {
            r = reflogs.get(reflogs.size - consumed);
            if (!RebaseDesc.i.exec(r.desc))
                return z;
            if (RebaseDesc.iStart.exec(r.desc))
                return <Rest>setRest<IList<RefLog>>(CONST.HEAD,
                    reflogs.skip(reflogs.size - consumed),
                    reflogs.take(reflogs.size - consumed));
        }
        return z;
    });

const headRebaseInteractiveAborted = b(
    allReflog(CONST.HEAD),
    reflogs => {
        type Rest = Parser<RefState, IList<RefLog>>;
        const z = <Rest>zero;
        if (reflogs.size < 2)
            return z;
        let r: RefLog, consumed = 1;
        for (let consumed = 1; consumed <= reflogs.size; consumed++) {
            r = reflogs.get(reflogs.size - consumed);
            // last item must be ""
            if (consumed === 1 && !RebaseDesc.iAbort.exec(r.desc))
                return z;
            // last but 1 item must be "rebase: aborting"
            if (consumed === 2 && RebaseDesc.aborting !== r.desc)
                return z;
            // take until "rebase -i (start)"
            if (RebaseDesc.iStart.exec(r.desc))
                return <Rest>setRest<IList<RefLog>>(CONST.HEAD,
                    reflogs.skip(reflogs.size - consumed),
                    reflogs.take(reflogs.size - consumed));
        }
        return z;
    });

const branchCreate = ([branchName, branchLast]: BranchTip) => /^branch: Created from/.exec(branchLast.desc);

const branchWithSameTip = (tip: RefLog) => <Parser<RefState, string>>(s => {
    for (const [refpath, reflogs] of s) {
        const t = reflogs.last();
        if (lodash.isEqual(t, tip))
            return unit(refpath)(s);
    }
    return zero(s);
});
