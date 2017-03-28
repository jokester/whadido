import { detectRefpath, Timestamp, RefLog } from "../git";

/**
 * Recovered operations and text-ify
 */

const enum OpType {
    // push a branch to remote repo
    remotePush = 0,

    checkout = 100,
    localCommitInBranch,
    localCommitAtBareHead,
    resetCurrentBranch,

    createLocalBranch = 200,

    localBranchFF,

    rebaseLocalBranch = 300,
    rebaseLocalBranchInteractive,

    renameRemoteBranch = 400,
}

export interface Operation {
    type: OpType;
    end: Timestamp;
}

export class RemotePush implements Operation {
    readonly type = OpType.remotePush;
    constructor(readonly refpath: string, readonly reflog: RefLog) { }
    toString() {
        return `RemotePush: ${JSON.stringify(this.reflog)} at ${this.refpath}}`;
    }
    get end() {
        return this.reflog.at;
    }
}

export class RemoteFetch implements Operation {
    readonly type = OpType.remotePush;
    constructor(readonly refpath: string, readonly reflog: RefLog) { }
    toString() {
        return `RemoteFetch: ${JSON.stringify(this.reflog)} at ${this.refpath}}`;
    }
    get end() {
        return this.reflog.at;
    }
}

/**
 * commit in local branch (plain or amend)
 * TODO: recognize amend
 */
export class LocalCommitInBranch implements Operation {
    readonly type = OpType.localCommitInBranch;

    constructor(readonly branchPath: string, readonly headRef: RefLog) { }

    get end() {
        return this.headRef.at;
    }
}

export class CreateLocateBranchAndCheckout implements Operation {
    readonly type = OpType.createLocalBranch;

    constructor(readonly branchPath: string, readonly branchLog: RefLog) { }

    get end() {
        return this.branchLog.at;
    }
}

export class MergeCurrentBranchFF implements Operation {
    readonly type = OpType.localBranchFF;
    constructor(readonly branchPath: string, readonly branchLog: RefLog) { }
    get end() {
        return this.branchLog.at;
    }
}

export class MergeCurrentBranch implements Operation {
    readonly type = OpType.localBranchFF;
    constructor(readonly branchPath: string, readonly branchLog: RefLog) { }
    get end() {
        return this.branchLog.at;
    }
}

export class Checkout implements Operation {
    readonly type = OpType.checkout;
    constructor(readonly headLog: RefLog) { }
    get end() {
        return this.headLog.at;
    }
}

export class ResetCurrentBranch implements Operation {
    readonly type = OpType.resetCurrentBranch;
    constructor(readonly branchPath: string, readonly branchLog: RefLog) { }
    get end() {
        return this.branchLog.at;
    }
}

export class RebaseCurrentBranch implements Operation {
    readonly type = OpType.rebaseLocalBranch;
    constructor(readonly branchPath: string,
        readonly branchLog: RefLog,
        readonly headFinish: RefLog,
        readonly headLogs: RefLog[]) { }
    get end() {
        return this.branchLog.at;
    }
}

export class RebaseCurrentBranchInteractive implements Operation {
    readonly type = OpType.rebaseLocalBranchInteractive;
    constructor(readonly branchPath: string,
        readonly branchLog: RefLog,
        readonly headFinish: RefLog,
        readonly headLogs: RefLog[]) { }
    get end() {
        return this.branchLog.at;
    }
}

export class RenameRemoteBranch implements Operation {
    readonly type = OpType.renameRemoteBranch;
    constructor(readonly branchPath: string,
        readonly branchLog: RefLog) { }

    get end() {
        return this.branchLog.at;
    }
}