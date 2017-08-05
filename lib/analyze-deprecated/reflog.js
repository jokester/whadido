"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash = require("lodash");
const immutable_1 = require("immutable");
const git_1 = require("../git");
const parser_1 = require("../parser");
const Op = require("./operations");
function build(dumps) {
    let m = immutable_1.Map();
    for (const d of dumps) {
        if (m.has(d.path))
            throw new Error(`duplicated refpath: ${d.path}`);
        m = m.set(d.path, d);
    }
    return m;
}
exports.build = build;
function countReflog(dumps) {
    return dumps.map(d => d.reflog.length).reduce((a, b) => a + b, 0);
}
exports.countReflog = countReflog;
function unmap(map) {
    return Array.from(map.values());
}
exports.unmap = unmap;
function analyzeDump(dumps) {
    const map0 = build(dumps);
    const remoteBranchNames = Array.from(map0.keys())
        .filter(k => git_1.detectRefpath.remote_branch.exec(k));
    const localBranchNames = Array.from(map0.keys())
        .filter(k => git_1.detectRefpath.local_branch.exec(k));
    const commitLocalBranch = localBranchNames.map(commitLocalBranch1);
    const createLocalBranchAndCheckout = localBranchNames.map(createLocalBranchAndCheckout1);
    const createLocalBranchWhenClone = localBranchNames.map(createLocalBranchWhenClone1);
    const mergeCurrentBranchFF = localBranchNames.map(mergeCurrentBranchFF1);
    const mergeCurrentBranch = localBranchNames.map(mergeExistingBranch1);
    const resetCurrentBranch = localBranchNames.map(resetCurrentBranch1);
    const rebaseCurrentBranch = localBranchNames.map(rebaseExistingBranch1);
    const rebaseCurrentBranchInteractive = localBranchNames.map(rebaseCurrentBranchInteractiveFinished1);
    const renameRemoteBranch = remoteBranchNames.map(renameRemoteBranch1);
    const pullBranchFF = localBranchNames.map(pullBranchFF1);
    const parser = parser_1.reiterate(parser_1.biased(...mergeCurrentBranchFF, ...mergeCurrentBranch, ...resetCurrentBranch, ...createLocalBranchAndCheckout, ...commitLocalBranch, ...rebaseCurrentBranch, ...rebaseCurrentBranchInteractive, ...renameRemoteBranch, localCheckout1, mergeRemovedBranchFF1, commitHead1, resetNonBranch1, rebaseUnknownRefInteractiveFinished, rebaseUnknownRefInteractiveAborted, ...createLocalBranchWhenClone, ...pullBranchFF, mergeUnknownRef, rebaseUnknownRefAborted, rebaseUnknownRefFinished));
    return parser(map0);
}
exports.analyzeDump = analyzeDump;
const getLastReflog = (refpath) => ((input) => {
    const ref = input.get(refpath);
    if (ref && ref.reflog.length) {
        return [{
                output: lodash.last(ref.reflog),
                rest: input.set(refpath, Object.assign({}, ref, { reflog: lodash.initial(ref.reflog) })),
            }];
    }
    return [];
});
const commitLocalBranch1 = (branchPath) => parser_1.seq2(getLastReflog(git_1.CONST.HEAD), getLastReflog(branchPath), (headLast, branchLast) => {
    if (lodash.isEqual(headLast.at, branchLast.at)
        && /^commit( \(amend\))?:/.exec(headLast.desc)
        && headLast.desc === branchLast.desc) {
        return parser_1.unit(new Op.LocalCommitInBranch(branchPath, headLast));
    }
    return parser_1.zero;
});
const commitHead1 = parser_1.bind(getLastReflog(git_1.CONST.HEAD), (headLast) => {
    if (/^commit( \(amend\))?:/.exec(headLast.desc)) {
        return parser_1.unit(new Op.LocalCommmit(headLast));
    }
    return parser_1.zero;
});
/**
 *
 * @param branchPath
 */
const createLocalBranchWhenClone1 = (branchPath) => parser_1.seq2(getLastReflog(git_1.CONST.HEAD), getLastReflog(branchPath), (headLast, branchLast) => {
    if (lodash.isEqual(headLast.at, branchLast.at)
        && git_1.CONST.EMPTY_OBJ === branchLast.from
        && branchLast.from === headLast.from
        && branchLast.to === headLast.to
        && branchLast.desc === headLast.desc
        && /^clone: /.exec(headLast.desc)) {
        return parser_1.unit(new Op.CreateLocateBranchWhenClone(branchPath, branchLast));
    }
    return parser_1.zero;
});
const createLocalBranchAndCheckout1 = (branchPath) => parser_1.seq2(getLastReflog(git_1.CONST.HEAD), getLastReflog(branchPath), (headLast, branchLast) => {
    if (lodash.isEqual(headLast.at, branchLast.at)
        && git_1.CONST.EMPTY_OBJ === branchLast.from
        && headLast.to === branchLast.to
        && /^checkout:/.exec(headLast.desc)
        && /^branch: Created/.exec(branchLast.desc)) {
        return parser_1.unit(new Op.CreateLocateBranchAndCheckout(branchPath, branchLast));
    }
    return parser_1.zero;
});
/**
 * merge something into current branch, without creating new commit
 */
const mergeCurrentBranchFF1 = (branchPath) => parser_1.seq2(getLastReflog(git_1.CONST.HEAD), getLastReflog(branchPath), (headLast, branchLast) => {
    if (lodash.isEqual(headLast.at, branchLast.at)
        && headLast.from === branchLast.from
        && headLast.to === branchLast.to
        && /^merge .*?: Fast-forward$/.exec(headLast.desc)
        && headLast.desc === branchLast.desc) {
        return parser_1.unit(new Op.MergeExistingBranchFF(branchPath, branchLast));
    }
    return parser_1.zero;
});
const mergeRemovedBranchFF1 = parser_1.bind(getLastReflog(git_1.CONST.HEAD), (headLast) => {
    if (/^merge .*?: Fast-forward$/.exec(headLast.desc)) {
        return parser_1.unit(new Op.MergeDeletedBranchFF(headLast));
    }
    return parser_1.zero;
});
/**
 * merge something into current branch, creating new commit
 */
const mergeExistingBranch1 = (branchPath) => parser_1.seq2(getLastReflog(git_1.CONST.HEAD), getLastReflog(branchPath), (headLast, branchLast) => {
    if (lodash.isEqual(headLast.at, branchLast.at)
        && headLast.from === branchLast.from
        && headLast.to === branchLast.to
        && (/^commit \(merge\):/.exec(headLast.desc) || /^merge .+?: Merge made by/.exec(headLast.desc))
        && headLast.desc === branchLast.desc) {
        return parser_1.unit(new Op.MergeExistingBranch(branchPath, branchLast));
    }
    return parser_1.zero;
});
const mergeUnknownRef = parser_1.bind(getLastReflog(git_1.CONST.HEAD), (headLast) => {
    if (/^commit \(merge\):/.exec(headLast.desc)) {
        return parser_1.unit(new Op.MergeUnknownRef(headLast));
    }
    return parser_1.zero;
});
const resetCurrentBranch1 = (branchPath) => parser_1.seq2(getLastReflog(git_1.CONST.HEAD), getLastReflog(branchPath), (headLast, branchLast) => {
    if (lodash.isEqual(headLast.at, branchLast.at)
        && headLast.from === branchLast.from
        && headLast.to === branchLast.to
        && /^reset: moving/.exec(headLast.desc)
        && headLast.desc === branchLast.desc) {
        return parser_1.unit(new Op.ResetCurrentBranch(branchPath, branchLast));
    }
    return parser_1.zero;
});
const pullBranchFF1 = (branchPath) => parser_1.seq2(getLastReflog(git_1.CONST.HEAD), getLastReflog(branchPath), (headLast, branchLast) => {
    if (lodash.isEqual(headLast.at, branchLast.at)
        && headLast.from === branchLast.from
        && headLast.to === branchLast.to
        && "pull: Fast-forward" === headLast.desc
        && headLast.desc === branchLast.desc) {
        return parser_1.unit(new Op.RemotePullFF(branchPath, branchLast));
    }
    return parser_1.zero;
});
const resetNonBranch1 = parser_1.bind(getLastReflog(git_1.CONST.HEAD), (headLast) => {
    if (/^reset: moving/.exec(headLast.desc)) {
        return parser_1.unit(new Op.ResetUnknown(headLast));
    }
    return parser_1.zero;
});
const localCheckout1 = parser_1.bind(getLastReflog(git_1.CONST.HEAD), (headLast) => {
    if (/^checkout: moving from /.exec(headLast.desc)) {
        return parser_1.unit(new Op.Checkout(headLast));
    }
    return parser_1.zero;
});
const rebaseExistingBranch1 = (branchPath) => parser_1.bind(getLastReflog(branchPath), (branchLast) => (input) => {
    if (!/^rebase finished: /.exec(branchLast.desc))
        return [];
    const head = input.get(git_1.CONST.HEAD);
    if (!head && head.reflog.length < 2)
        return [];
    const reflogs = head.reflog.slice();
    const headRebasing = [];
    // last in HEAD should have message "rebase finished: ...":
    const headFinish = reflogs.pop();
    if (!/^rebase finished: returning to /.exec(headFinish.desc))
        return [];
    let l;
    while ((l = reflogs.pop()) && /^rebase: /.exec(l.desc)) {
        headRebasing.push(l);
        if (l.from === branchLast.from) {
            // yield result when we found the first commit in rebase actions
            const rest = input.set(git_1.CONST.HEAD, Object.assign({}, head, { reflog: reflogs }));
            return [{
                    output: new Op.RebaseCurrentBranch(branchPath, branchLast, headFinish, headRebasing),
                    rest
                }];
        }
    }
    return [];
});
const rebaseCurrentBranchInteractiveFinished1 = (branchPath) => parser_1.bind(getLastReflog(branchPath), (branchLast) => (input) => {
    if (!/^rebase -i \(finish\): /.exec(branchLast.desc))
        return [];
    const head = input.get(git_1.CONST.HEAD);
    if (!head && head.reflog.length < 2)
        return [];
    const reflogs = head.reflog.slice();
    const headRebasing = [];
    // last in HEAD should have message "rebase -i (finish):":
    const headFinish = reflogs.pop();
    if (!/^rebase -i \(finish\): /.exec(headFinish.desc))
        return [];
    let l;
    while ((l = reflogs.pop()) && /^rebase -i /.exec(l.desc)) {
        headRebasing.push(l);
        if (l.from === branchLast.from) {
            // yield result when we found the first commit in rebase actions
            const rest = input.set(git_1.CONST.HEAD, Object.assign({}, head, { reflog: reflogs }));
            return [{
                    output: new Op.RebaseCurrentBranchInteractive(branchPath, branchLast, headFinish, headRebasing),
                    rest
                }];
        }
    }
    return [];
});
const rebaseUnknownRefInteractiveFinished = (input) => {
    const head = input.get(git_1.CONST.HEAD);
    if (!head || head.reflog.length < 2)
        return [];
    const reflogs = head.reflog.slice();
    const headRebasing = [];
    // last in HEAD should have message "rebase -i (finish):":
    const headFinish = reflogs.pop();
    if (!/^rebase -i \(finish\): /.exec(headFinish.desc))
        return [];
    let l;
    while ((l = reflogs.pop()) && /^rebase -i /.exec(l.desc)) {
        headRebasing.push(l);
        if (/^rebase -i \(start\): /.exec(l.desc)) {
            // yield result when we found the first commit in rebase actions
            const rest = input.set(git_1.CONST.HEAD, Object.assign({}, head, { reflog: reflogs }));
            return [{
                    output: new Op.RebaseUnknownRefInteractive(headFinish, headRebasing),
                    rest
                }];
        }
    }
    return [];
};
const rebaseUnknownRefInteractiveAborted = (input) => {
    const head = input.get(git_1.CONST.HEAD);
    if (!head || head.reflog.length < 2)
        return [];
    const reflogs = head.reflog.slice();
    const headRebasing = [];
    // last in HEAD should have message "rebase -i (abort):":
    const headAbort = reflogs.pop();
    if (!/^rebase -i \(abort\): /.exec(headAbort.desc))
        return [];
    // take until a "rebase -i (start)" reflog
    let l;
    while ((l = reflogs.pop()) && /^rebase\W/.exec(l.desc)) {
        headRebasing.push(l);
        if (/^rebase -i \(start\): /.exec(l.desc)) {
            // yield result when we found the first commit in rebase actions
            const rest = input.set(git_1.CONST.HEAD, Object.assign({}, head, { reflog: reflogs }));
            return [{
                    output: new Op.RebaseUnknownRefInteractiveAborted(headAbort, headRebasing),
                    rest
                }];
        }
    }
    return [];
};
const rebaseUnknownRefAborted = (input) => {
    const head = input.get(git_1.CONST.HEAD);
    if (!head || head.reflog.length < 2)
        return [];
    const reflogs = head.reflog.slice();
    const headRebasing = [];
    // last in HEAD should have message "rebase -i (abort):":
    const headAbort = reflogs.pop();
    if ("rebase: updating HEAD" !== headAbort.desc)
        return [];
    // take until a "rebase -i (start)" reflog
    let l;
    while ((l = reflogs.pop()) && /^rebase\W/.exec(l.desc)) {
        headRebasing.push(l);
        if (/^rebase: checkout /.exec(l.desc)) {
            // yield result when we found the first commit in rebase actions
            const rest = input.set(git_1.CONST.HEAD, Object.assign({}, head, { reflog: reflogs }));
            return [{
                    output: new Op.RebaseUnknownRefAborted(headAbort, headRebasing),
                    rest
                }];
        }
    }
    return [];
};
const rebaseUnknownRefFinished = (input) => {
    const head = input.get(git_1.CONST.HEAD);
    if (!head || head.reflog.length < 2)
        return [];
    const reflogs = head.reflog.slice();
    const headFinish = reflogs.pop();
    if (!/^rebase finished: returning to /.exec(headFinish.desc))
        return [];
    const headRebasing = [headFinish];
    let l;
    while ((l = reflogs.pop()) && /^rebase\W/.exec(l.desc)) {
        if (/^rebase: checkout /.exec(l.desc)) {
            const headStart = l;
            // yield result when we found the first commit in rebase actions
            const rest = input.set(git_1.CONST.HEAD, Object.assign({}, head, { reflog: reflogs }));
            return [{
                    output: new Op.RebaseUnknownRefFinished(headStart, headFinish, headRebasing),
                    rest
                }];
        }
        // else: save it
        headRebasing.push(l);
    }
    return [];
};
const renameRemoteBranch1 = (remoteBranchPath) => parser_1.bind(getLastReflog(remoteBranchPath), (lastReflog) => {
    if (/^remote: renamed /.exec(lastReflog.desc)) {
        return parser_1.unit(new Op.RenameRemoteBranch(remoteBranchPath, lastReflog));
    }
    return parser_1.zero;
});
//# sourceMappingURL=reflog.js.map