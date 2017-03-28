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
    const pushRemoteBranch = remoteBranchNames.map(pushRemoteBranch1);
    const fetchRemoteBranch = remoteBranchNames.map(fetchRemoteBranch1);
    const commitLocalBranch = localBranchNames.map(commitLocalBranch1);
    const createLocalBranch = localBranchNames.map(createLocalBranch1);
    const mergeCurrentBranchFF = localBranchNames.map(mergeCurrentBranchFF1);
    const mergeCurrentBranch = localBranchNames.map(mergeCurrentBranch1);
    const resetCurrentBranch = localBranchNames.map(resetCurrentBranch1);
    const rebaseCurrentBranch = localBranchNames.map(rebaseCurrentBranch1);
    const rebaseCurrentBranchInteractive = localBranchNames.map(rebaseCurrentBranchInteractive1);
    const renameRemoteBranch = remoteBranchNames.map(renameRemoteBranch1);
    const parser = parser_1.reiterate(parser_1.biased(...mergeCurrentBranchFF, ...mergeCurrentBranch, ...resetCurrentBranch, ...createLocalBranch, ...commitLocalBranch, localCheckout1, ...rebaseCurrentBranch, ...rebaseCurrentBranchInteractive, ...pushRemoteBranch, ...fetchRemoteBranch, ...renameRemoteBranch));
    return parser(map0);
}
exports.analyzeDump = analyzeDump;
/**
 * Push to a remote branch: "update by push"
 */
const pushRemoteBranch1 = (refPath) => parser_1.bind(getLastReflog(refPath), (lastLog) => {
    if (/^update by push/.exec(lastLog.desc))
        return parser_1.unit(new Op.RemotePush(refPath, lastLog));
    else
        return parser_1.zero;
});
const fetchRemoteBranch1 = (refPath) => parser_1.bind(getLastReflog(refPath), (lastLog) => {
    if (/^fetch\W/.exec(lastLog.desc))
        return parser_1.unit(new Op.RemoteFetch(refPath, lastLog));
    else
        return parser_1.zero;
});
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
const createLocalBranch1 = (branchPath) => parser_1.seq2(getLastReflog(git_1.CONST.HEAD), getLastReflog(branchPath), (headLast, branchLast) => {
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
        return parser_1.unit(new Op.MergeCurrentBranchFF(branchPath, branchLast));
    }
    return parser_1.zero;
});
/**
 * merge something into current branch, without creating new commit
 */
const mergeCurrentBranch1 = (branchPath) => parser_1.seq2(getLastReflog(git_1.CONST.HEAD), getLastReflog(branchPath), (headLast, branchLast) => {
    if (lodash.isEqual(headLast.at, branchLast.at)
        && headLast.from === branchLast.from
        && headLast.to === branchLast.to
        && (/^commit \(merge\):/.exec(headLast.desc) || /^merge .+?: Merge made by/.exec(headLast.desc))
        && headLast.desc === branchLast.desc) {
        return parser_1.unit(new Op.MergeCurrentBranch(branchPath, branchLast));
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
const localCheckout1 = parser_1.bind(getLastReflog(git_1.CONST.HEAD), (headLast) => {
    if (/^checkout: moving from /.exec(headLast.desc)) {
        return parser_1.unit(new Op.Checkout(headLast));
    }
    return parser_1.zero;
});
const rebaseCurrentBranch1 = (branchPath) => parser_1.bind(getLastReflog(branchPath), (branchLast) => (input) => {
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
const rebaseCurrentBranchInteractive1 = (branchPath) => parser_1.bind(getLastReflog(branchPath), (branchLast) => (input) => {
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
const renameRemoteBranch1 = (remoteBranchPath) => parser_1.bind(getLastReflog(remoteBranchPath), (lastReflog) => {
    if (/^remote: renamed /.exec(lastReflog.desc)) {
        return parser_1.unit(new Op.RenameRemoteBranch(remoteBranchPath, lastReflog));
    }
    return parser_1.zero;
});
//# sourceMappingURL=reflog.js.map