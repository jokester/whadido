"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash = require("lodash");
const git_1 = require("../git");
const Op = require("./operations");
const parser_1 = require("../parser");
// instantialized unit<S, A>
function u(op) {
    return parser_1.unit(op);
}
function setRest(refpath, output, reflogs) {
    return ((input) => [{ output, rest: input.set(refpath, reflogs) }]);
}
const b = parser_1.bind;
/**
 * take last reflog of refpath
 * @param refpath
 */
const popReflog = (refpath) => ((input) => {
    const l = input.get(refpath);
    if (l && l.size)
        return [{ output: l.last(), rest: input.set(refpath, l.butLast()) }];
    return [];
});
const allReflog = (refpath) => ((input) => {
    if (input.has(refpath)) {
        return [{ output: input.get(refpath), rest: input.delete(refpath) }];
    }
    return [];
});
const popHead = popReflog(git_1.CONST.HEAD);
function topParser(state) {
    const localBranches = Array.from(state.keys())
        .filter(refpath => git_1.detectRefpath.local_branch.exec(refpath));
    const remoteBranches = Array.from(state.keys())
        .filter(refpath => git_1.detectRefpath.remote_branch.exec(refpath));
    const popRemote = remoteBranches.map(branchName => b(popReflog(branchName), branchLast => parser_1.unit([branchName, branchLast])));
    const popLocal = localBranches.map(branchName => b(popReflog(branchName), branchLast => parser_1.unit([branchName, branchLast])));
    const parser = parser_1.reiterate(parser_1.biased(...popRemote.map(p => b(p, ([branchpath, branchLast]) => {
        if (/^update by push/.exec(branchLast.desc))
            return u(new Op.Push(branchpath, branchLast));
        return parser_1.zero;
    })), ...popRemote.map(p => b(p, ([branchpath, branchLast]) => {
        if (/^fetch/.exec(branchLast.desc))
            return u(new Op.Fetch(branchpath, branchLast));
        return parser_1.zero;
    })), ...popRemote.map(p => b(p, ([branchpath, branchLast]) => {
        if (/^remote: renamed /.exec(branchLast.desc))
            return u(new Op.RenameRemote(branchpath, branchLast));
        return parser_1.zero;
    })), 
    // merge
    b(headMerge, headLast => parser_1.biased(
    // 1 head + 1 branch
    ...popLocal.map(p => b(p, ([branchPath, branchLast]) => {
        if (sameDesc(headLast, branchLast) && sameTime(headLast, branchLast)) {
            return u(new Op.Merge(headLast, branchPath, branchLast));
        }
        return parser_1.zero;
    })), 
    // head only
    u(new Op.Merge(headLast, null, null)))), 
    // commit
    b(headCommit, headLast => parser_1.biased(
    // 1 head + 1 branch
    ...popLocal.map(p => b(p, ([branchPath, branchLast]) => {
        if (sameDesc(headLast, branchLast) && sameTime(headLast, branchLast)) {
            return u(new Op.Commit(headLast, branchPath, branchLast));
        }
        return parser_1.zero;
    })), 
    // head only
    u(new Op.Commit(headLast)))), 
    // create + checkout
    ...popLocal.map(p => b(parser_1.filter(p, branchCreate), ([branchPath, branchLast]) => parser_1.biased(b(headCheckout, headLast => {
        const branch = git_1.git_parser.extractLocalBranch(branchPath);
        if (sameTime(headLast, branchLast)
            && sameDest(headLast, branchLast)) {
            return u(new Op.CreateBranch(branchLast, branchPath, headLast));
        }
        return parser_1.zero;
    }), 
    // create w/o checkout
    u(new Op.CreateBranch(branchLast, branchPath, null))))), 
    // rebase (finished)
    b(headRebaseFinished, (headReflogs) => parser_1.biased(...popLocal.map(p => parser_1.bind(p, ([branchPath, branchLast]) => {
        if (headReflogs.first().from === branchLast.from
            && headReflogs.last().to === branchLast.to
            && RebaseDesc.finishBranch.exec(branchLast.desc))
            return u(new Op.RebaseFinished(headReflogs.toJS(), branchPath, branchLast));
        return parser_1.zero;
    })), u(new Op.RebaseFinished(headReflogs.toJS())))), 
    // rebase -i (finished)
    b(headRebaseInteractiveFinished, headReflogs => parser_1.biased(...popLocal.map(p => parser_1.bind(p, ([branchPath, branchLast]) => {
        if (headReflogs.first().from === branchLast.from
            && headReflogs.last().to === branchLast.to
            && RebaseDesc.iFinish.exec(branchLast.desc))
            return u(new Op.RebaseInteractiveFinished(headReflogs.toJS(), branchPath, branchLast));
        return parser_1.zero;
    })), u(new Op.RebaseInteractiveFinished(headReflogs.toJS())))), 
    // rebase -i (abort)
    b(headRebaseInteractiveAborted, headReflogs => u(new Op.RebaseInteractiveAborted(headReflogs.toJS()))), 
    // reset
    b(headReset, headLast => parser_1.biased(
    // 1 head + 1 branch
    ...popLocal.map(p => b(p, ([branchName, branchLast]) => {
        if (sameDesc(headLast, branchLast) && sameTime(headLast, branchLast)) {
            return u(new Op.Reset(headLast, branchName, branchLast));
        }
        return parser_1.zero;
    })), 
    // head only
    u(new Op.Reset(headLast)))), 
    // checkout only
    b(headCheckout, headTop => u(new Op.Checkout(headTop))), 
    // clone
    b(headClone, headLast => parser_1.biased(
    // 1 head + 1 branch
    ...popLocal.map(p => b(p, ([branchName, branchLast]) => {
        if (sameDesc(headLast, branchLast) && sameTime(headLast, branchLast)) {
            return u(new Op.Clone(headLast, branchName, branchLast));
        }
        return parser_1.zero;
    })), u(new Op.Clone(headLast)))), 
    // pull: 1 head + 1/0 local branch + 1/0 remote branch
    b(headPull, headLast => b(parser_1.maybeDefault([null, null], parser_1.biased(...popLocal.map(p => parser_1.bind(p, ([localBranchName, localLast]) => {
        if (sameDesc(headLast, localLast) && sameTime(headLast, localLast))
            return parser_1.unit([localBranchName, localLast]);
        return parser_1.zero;
    })))), ([localBranchName, localLast]) => b(parser_1.maybeDefault([null, null], parser_1.biased(...popRemote.map(p => parser_1.bind(p, ([remoteBranchName, remoteLast]) => {
        if (sameDesc(headLast, remoteLast, true) && sameTime(headLast, remoteLast))
            return parser_1.unit([remoteBranchName, remoteLast]);
        return parser_1.zero;
    })))), ([remoteBranchName, remoteBranchLast]) => u(new Op.Pull(headLast)))))));
    return parser(state);
}
exports.topParser = topParser;
function sameDesc(l1, l2, ignoreCase = false) {
    return l1 && l2 &&
        (ignoreCase ? (l1.desc.toLowerCase() === l2.desc.toLowerCase()) : l1.desc === l2.desc);
}
function sameTime(l1, l2) {
    return l1 && l2 && lodash.isEqual(l1.at, l2.at);
}
function sameDest(l1, l2) {
    return l1 && l2 && l1.to === l2.to;
}
const headCheckout = parser_1.filter(popReflog(git_1.CONST.HEAD), headLast => /^checkout:/.exec(headLast.desc));
const headReset = parser_1.filter(popReflog(git_1.CONST.HEAD), headLast => /^reset:/.exec(headLast.desc));
const headMerge = parser_1.filter(popReflog(git_1.CONST.HEAD), headLast => /^merge\W/.exec(headLast.desc));
const headCommit = parser_1.filter(popReflog(git_1.CONST.HEAD), headLast => /^commit( \((amend|merge)\))?:/.exec(headLast.desc));
const headClone = parser_1.filter(popReflog(git_1.CONST.HEAD), headLast => /^clone: from /.exec(headLast.desc));
const headPull = parser_1.filter(popReflog(git_1.CONST.HEAD), headLast => /^pull: /.exec(headLast.desc));
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
const headRebaseFinished = b(allReflog(git_1.CONST.HEAD), reflogs => {
    const z = parser_1.zero;
    if (reflogs.size < 2)
        return z;
    if (!RebaseDesc.finishHead.exec(reflogs.last().desc))
        return z;
    let r, consumed = 1;
    for (let consumed = 1; consumed <= reflogs.size; consumed++) {
        r = reflogs.get(reflogs.size - consumed);
        if (!RebaseDesc.inProgress.exec(r.desc))
            return z;
        if (RebaseDesc.checkout.exec(r.desc))
            return setRest(git_1.CONST.HEAD, reflogs.skip(reflogs.size - consumed), reflogs.take(reflogs.size - consumed));
    }
    return z;
});
const headRebaseInteractiveFinished = b(allReflog(git_1.CONST.HEAD), reflogs => {
    const z = parser_1.zero;
    if (reflogs.size < 2)
        return z;
    if (!RebaseDesc.iFinish.exec(reflogs.last().desc))
        return z;
    let r, consumed = 1;
    for (let consumed = 1; consumed <= reflogs.size; consumed++) {
        r = reflogs.get(reflogs.size - consumed);
        if (!RebaseDesc.i.exec(r.desc))
            return z;
        if (RebaseDesc.iStart.exec(r.desc))
            return setRest(git_1.CONST.HEAD, reflogs.skip(reflogs.size - consumed), reflogs.take(reflogs.size - consumed));
    }
    return z;
});
const headRebaseInteractiveAborted = b(allReflog(git_1.CONST.HEAD), reflogs => {
    const z = parser_1.zero;
    if (reflogs.size < 2)
        return z;
    let r, consumed = 1;
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
            return setRest(git_1.CONST.HEAD, reflogs.skip(reflogs.size - consumed), reflogs.take(reflogs.size - consumed));
    }
    return z;
});
const branchCreate = ([branchName, branchLast]) => /^branch: Created from/.exec(branchLast.desc);
const branchWithSameTip = (tip) => (s => {
    for (const [refpath, reflogs] of s) {
        const t = reflogs.last();
        if (lodash.isEqual(t, tip))
            return parser_1.unit(refpath)(s);
    }
    return parser_1.zero(s);
});
//# sourceMappingURL=reflog.js.map