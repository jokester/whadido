"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        this.type = 0 /* remotePush */;
    }
    toString() {
        return `RemoteFetch: ${JSON.stringify(this.reflog)} at ${this.refpath}}`;
    }
    get end() {
        return this.reflog.at;
    }
}
exports.RemoteFetch = RemoteFetch;
/**
 * commit in local branch (plain or amend)
 * TODO: recognize amend
 */
class LocalCommitInBranch {
    constructor(branchPath, headRef) {
        this.branchPath = branchPath;
        this.headRef = headRef;
        this.type = 101 /* localCommitInBranch */;
    }
    get end() {
        return this.headRef.at;
    }
}
exports.LocalCommitInBranch = LocalCommitInBranch;
class CreateLocateBranchAndCheckout {
    constructor(branchPath, branchLog) {
        this.branchPath = branchPath;
        this.branchLog = branchLog;
        this.type = 200 /* createLocalBranch */;
    }
    get end() {
        return this.branchLog.at;
    }
}
exports.CreateLocateBranchAndCheckout = CreateLocateBranchAndCheckout;
class MergeCurrentBranchFF {
    constructor(branchPath, branchLog) {
        this.branchPath = branchPath;
        this.branchLog = branchLog;
        this.type = 201 /* localBranchFF */;
    }
    get end() {
        return this.branchLog.at;
    }
}
exports.MergeCurrentBranchFF = MergeCurrentBranchFF;
class MergeCurrentBranch {
    constructor(branchPath, branchLog) {
        this.branchPath = branchPath;
        this.branchLog = branchLog;
        this.type = 201 /* localBranchFF */;
    }
    get end() {
        return this.branchLog.at;
    }
}
exports.MergeCurrentBranch = MergeCurrentBranch;
class Checkout {
    constructor(headLog) {
        this.headLog = headLog;
        this.type = 100 /* checkout */;
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
        this.type = 103 /* resetCurrentBranch */;
    }
    get end() {
        return this.branchLog.at;
    }
}
exports.ResetCurrentBranch = ResetCurrentBranch;
class RebaseCurrentBranch {
    constructor(branchPath, branchLog, headFinish, headLogs) {
        this.branchPath = branchPath;
        this.branchLog = branchLog;
        this.headFinish = headFinish;
        this.headLogs = headLogs;
        this.type = 300 /* rebaseLocalBranch */;
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
        this.type = 301 /* rebaseLocalBranchInteractive */;
    }
    get end() {
        return this.branchLog.at;
    }
}
exports.RebaseCurrentBranchInteractive = RebaseCurrentBranchInteractive;
class RenameRemoteBranch {
    constructor(branchPath, branchLog) {
        this.branchPath = branchPath;
        this.branchLog = branchLog;
        this.type = 400 /* renameRemoteBranch */;
    }
    get end() {
        return this.branchLog.at;
    }
}
exports.RenameRemoteBranch = RenameRemoteBranch;
//# sourceMappingURL=operations.js.map