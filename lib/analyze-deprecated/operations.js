"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function dumpClassName() {
    const p1 = (this.constructor || UnknownClass).name;
    const p2 = JSON.stringify(this);
    return `${p1}: ${p2}`;
}
function UnknownClass() { }
class BasicOp {
    pack() {
        const p1 = { className: (this.constructor || UnknownClass).name };
        const p2 = JSON.parse(JSON.stringify(this));
        return Object.assign({}, p2, p1);
    }
}
function op2obj(op) {
    const p1 = { className: op.constructor.name };
    const p2 = JSON.parse(JSON.stringify(op));
    return Object.assign({}, p1, p2);
}
exports.op2obj = op2obj;
class RemotePush {
    constructor(refpath, reflog) {
        this.refpath = refpath;
        this.reflog = reflog;
        this.type = 0 /* remotePush */;
    }
    toString() {
        return `RemotePush: ${JSON.stringify(this.reflog)} at ${this.refpath}}`;
    }
    get end() {
        return this.reflog.at;
    }
}
exports.RemotePush = RemotePush;
class RemoteFetch {
    constructor(refpath, reflog) {
        this.refpath = refpath;
        this.reflog = reflog;
        this.type = 1 /* remoteFetch */;
        this.toString = dumpClassName;
    }
    get end() {
        return this.reflog.at;
    }
}
exports.RemoteFetch = RemoteFetch;
class RemotePullFF {
    constructor(refpath, reflog) {
        this.refpath = refpath;
        this.reflog = reflog;
        this.type = 2 /* remotePullFF */;
        this.toString = dumpClassName;
    }
    get end() {
        return this.reflog.at;
    }
}
exports.RemotePullFF = RemotePullFF;
/**
 * commit in local branch (plain or amend)
 * TODO: recognize amend
 */
class LocalCommitInBranch {
    constructor(branchPath, headRef) {
        this.branchPath = branchPath;
        this.headRef = headRef;
        this.type = 201 /* localCommitInBranch */;
        this.toString = dumpClassName;
    }
    get end() {
        return this.headRef.at;
    }
}
exports.LocalCommitInBranch = LocalCommitInBranch;
class LocalCommmit {
    constructor(headRef) {
        this.headRef = headRef;
        this.type = 200 /* localCommit */;
        this.toString = dumpClassName;
    }
    get end() {
        return this.headRef.at;
    }
}
exports.LocalCommmit = LocalCommmit;
class CreateLocateBranchAndCheckout {
    constructor(branchPath, branchLog) {
        this.branchPath = branchPath;
        this.branchLog = branchLog;
        this.type = 300 /* createLocalBranchAndCheckout */;
    }
    toString() {
        return `CreateLocateBranchAndCheckout`;
    }
    get end() {
        return this.branchLog.at;
    }
}
exports.CreateLocateBranchAndCheckout = CreateLocateBranchAndCheckout;
class CreateLocateBranchWhenClone {
    constructor(branchPath, branchLog) {
        this.branchPath = branchPath;
        this.branchLog = branchLog;
        this.type = 301 /* createLocalBranchWhenClone */;
        this.toString = dumpClassName;
    }
    get end() {
        return this.branchLog.at;
    }
}
exports.CreateLocateBranchWhenClone = CreateLocateBranchWhenClone;
class MergeExistingBranchFF {
    constructor(branchPath, branchLog) {
        this.branchPath = branchPath;
        this.branchLog = branchLog;
        this.type = 303 /* mergeExisingBranchFF */;
        this.toString = dumpClassName;
    }
    get end() {
        return this.branchLog.at;
    }
}
exports.MergeExistingBranchFF = MergeExistingBranchFF;
class MergeDeletedBranchFF {
    constructor(headLog) {
        this.headLog = headLog;
        this.type = 304 /* mergeDeletedBranchFF */;
        this.toString = dumpClassName;
    }
    get end() {
        return this.headLog.at;
    }
}
exports.MergeDeletedBranchFF = MergeDeletedBranchFF;
/**
 *
 * merging a unknown (ref or commit) into head
 *
 */
class MergeUnknownRef {
    constructor(headLog) {
        this.headLog = headLog;
        this.type = 305 /* mergeUnknownRef */;
        this.toString = dumpClassName;
    }
    get end() {
        return this.headLog.at;
    }
}
exports.MergeUnknownRef = MergeUnknownRef;
class MergeExistingBranch {
    constructor(branchPath, branchLog) {
        this.branchPath = branchPath;
        this.branchLog = branchLog;
        this.type = 302 /* mergeLocalBranch */;
    }
    toString() {
        return `MergeCurrentBranch`;
    }
    get end() {
        return this.branchLog.at;
    }
}
exports.MergeExistingBranch = MergeExistingBranch;
class Checkout {
    constructor(headLog) {
        this.headLog = headLog;
        this.type = 100 /* checkout */;
    }
    toString() {
        return `Checkout`;
    }
    get end() {
        return this.headLog.at;
    }
}
exports.Checkout = Checkout;
class ResetCurrentBranch {
    constructor(branchPath, branchLog) {
        this.branchPath = branchPath;
        this.branchLog = branchLog;
        this.type = 202 /* resetCurrentBranch */;
        this.toString = dumpClassName;
    }
    get end() {
        return this.branchLog.at;
    }
}
exports.ResetCurrentBranch = ResetCurrentBranch;
// reset to something that is not a currently-existing branch
class ResetUnknown {
    constructor(headLog) {
        this.headLog = headLog;
        this.type = 203 /* resetUnknown */;
    }
    get end() { return this.headLog.at; }
}
exports.ResetUnknown = ResetUnknown;
class RebaseCurrentBranch {
    constructor(branchPath, branchLog, headFinish, headLogs) {
        this.branchPath = branchPath;
        this.branchLog = branchLog;
        this.headFinish = headFinish;
        this.headLogs = headLogs;
        this.type = 400 /* rebaseLocalBranch */;
    }
    toString() {
        return `RebaseCurrentBranch`;
    }
    get end() {
        return this.branchLog.at;
    }
}
exports.RebaseCurrentBranch = RebaseCurrentBranch;
class RebaseCurrentBranchInteractive {
    constructor(branchPath, branchLog, headFinish, headLogs) {
        this.branchPath = branchPath;
        this.branchLog = branchLog;
        this.headFinish = headFinish;
        this.headLogs = headLogs;
        this.type = 401 /* rebaseLocalBranchInteractive */;
    }
    toString() {
        return `RebaseCurrentBranchInteractive`;
    }
    get end() {
        return this.branchLog.at;
    }
}
exports.RebaseCurrentBranchInteractive = RebaseCurrentBranchInteractive;
class RebaseUnknownRefInteractive {
    constructor(headFinish, headLogs) {
        this.headFinish = headFinish;
        this.headLogs = headLogs;
        this.type = 402 /* rebaseUnknownInteractiveFinished */;
        this.toString = dumpClassName;
    }
    get end() {
        return this.headFinish.at;
    }
}
exports.RebaseUnknownRefInteractive = RebaseUnknownRefInteractive;
class RebaseUnknownRefInteractiveAborted {
    constructor(headAbort, headLogs) {
        this.headAbort = headAbort;
        this.headLogs = headLogs;
        this.type = 403 /* rebaseUnknownInteractiveAborted */;
        this.toString = dumpClassName;
    }
    get end() {
        return this.headAbort.at;
    }
}
exports.RebaseUnknownRefInteractiveAborted = RebaseUnknownRefInteractiveAborted;
class RebaseUnknownRefAborted {
    constructor(headAbort, headLogs) {
        this.headAbort = headAbort;
        this.headLogs = headLogs;
        this.type = 405 /* rebaseUnknownAborted */;
        this.toString = dumpClassName;
    }
    get end() {
        return this.headAbort.at;
    }
}
exports.RebaseUnknownRefAborted = RebaseUnknownRefAborted;
class RebaseUnknownRefFinished {
    constructor(headStart, headFinish, headLogs) {
        this.headStart = headStart;
        this.headFinish = headFinish;
        this.headLogs = headLogs;
        this.type = 404 /* rebaseUnknownFinished */;
        this.toString = dumpClassName;
    }
    get end() {
        return this.headStart.at;
    }
}
exports.RebaseUnknownRefFinished = RebaseUnknownRefFinished;
class RenameRemoteBranch {
    constructor(branchPath, branchLog) {
        this.branchPath = branchPath;
        this.branchLog = branchLog;
        this.type = 500 /* renameRemoteBranch */;
    }
    toString() {
        return `RenameRemoteBranch`;
    }
    get end() {
        return this.branchLog.at;
    }
}
exports.RenameRemoteBranch = RenameRemoteBranch;
//# sourceMappingURL=operations.js.map