import { detectRefpath, Timestamp, RefLog } from "../git";

/**
 * Recovered operations and text-ify
 */
const enum OpType {

    // operations that only affact remote branch
    remotePush = 0,
    remoteFetch,
    remotePullFF,
    renameRemoteBranch = 500,

    // operations that only affact HEAD
    checkout = 100,

    // operations that affacts HEAD and local branch
    localCommit = 200,

    localCommitInBranch,
    // create a commit when not in a recognized branch, can be bare head or removed branch
    resetCurrentBranch,
    resetUnknown,

    createLocalBranchAndCheckout = 300,
    createLocalBranchWhenClone,

    mergeLocalBranch,
    mergeExisingBranchFF,
    mergeDeletedBranchFF,
    mergeUnknownRef,

    rebaseLocalBranch = 400,
    rebaseLocalBranchInteractive,
    rebaseUnknownInteractiveFinished,
    rebaseUnknownInteractiveAborted,
    rebaseUnknownFinished,
    rebaseUnknownAborted,

}

export interface Operation {
    type: OpType;
    end: Timestamp;
}

function dumpClassName() {
    const p1 = (this.constructor as Function || UnknownClass).name;
    const p2 = JSON.stringify(this);
    return `${p1}: ${p2}`;
}

function UnknownClass() { }

class BasicOp {
    readonly type: OpType;
    pack() {
        const p1 = { className: (this.constructor as Function || UnknownClass).name };
        const p2 = JSON.parse(JSON.stringify(this));
        return Object.assign({}, p2, p1) as {};
    }
}

export function op2obj(op: Operation & Object): {} {
    const p1 = { className: (op.constructor as Function).name };
    const p2 = JSON.parse(JSON.stringify(op)) as typeof op;
    return { ...p1, ...p2 };
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
    readonly type = OpType.remoteFetch;
    constructor(readonly refpath: string, readonly reflog: RefLog) { }
    toString = dumpClassName;
    get end() {
        return this.reflog.at;
    }
}

export class RemotePullFF implements Operation {
    readonly type = OpType.remotePullFF;
    constructor(readonly refpath: string, readonly reflog: RefLog) { }
    toString = dumpClassName;
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

    toString = dumpClassName;
    get end() {
        return this.headRef.at;
    }
}

export class LocalCommmit implements Operation {
    readonly type = OpType.localCommit;
    constructor(readonly headRef: RefLog) { }
    toString = dumpClassName;
    get end() {
        return this.headRef.at;
    }
}

export class CreateLocateBranchAndCheckout implements Operation {
    readonly type = OpType.createLocalBranchAndCheckout;

    constructor(readonly branchPath: string, readonly branchLog: RefLog) { }
    toString() {
        return `CreateLocateBranchAndCheckout`;
    }
    get end() {
        return this.branchLog.at;
    }
}

export class CreateLocateBranchWhenClone implements Operation {
    readonly type = OpType.createLocalBranchWhenClone;

    constructor(readonly branchPath: string, readonly branchLog: RefLog) { }

    toString = dumpClassName;
    get end() {
        return this.branchLog.at;
    }
}

export class MergeExistingBranchFF implements Operation {
    readonly type = OpType.mergeExisingBranchFF;
    constructor(readonly branchPath: string, readonly branchLog: RefLog) { }
    toString = dumpClassName;
    get end() {
        return this.branchLog.at;
    }
}

export class MergeDeletedBranchFF implements Operation {
    readonly type = OpType.mergeDeletedBranchFF;
    constructor(readonly headLog: RefLog) { }
    toString = dumpClassName;
    get end() {
        return this.headLog.at;
    }
}

/**
 *
 * merging a unknown (ref or commit) into head
 *
 */
export class MergeUnknownRef implements Operation {
    readonly type = OpType.mergeUnknownRef;
    constructor(readonly headLog: RefLog) { }
    toString = dumpClassName;
    get end() {
        return this.headLog.at;
    }
}

export class MergeExistingBranch implements Operation {
    readonly type = OpType.mergeLocalBranch;
    constructor(readonly branchPath: string, readonly branchLog: RefLog) { }
    toString() {
        return `MergeCurrentBranch`;
    }
    get end() {
        return this.branchLog.at;
    }
}

export class Checkout implements Operation {
    readonly type = OpType.checkout;
    constructor(readonly headLog: RefLog) { }
    toString() {
        return `Checkout`;
    }
    get end() {
        return this.headLog.at;
    }
}

export class ResetCurrentBranch implements Operation {
    readonly type = OpType.resetCurrentBranch;
    constructor(readonly branchPath: string, readonly branchLog: RefLog) { }
    toString = dumpClassName;
    get end() {
        return this.branchLog.at;
    }
}

// reset to something that is not a currently-existing branch
export class ResetUnknown implements Operation {
    readonly type = OpType.resetUnknown;
    constructor(readonly headLog: RefLog) { }
    get end() { return this.headLog.at; }
}

export class RebaseCurrentBranch implements Operation {
    readonly type = OpType.rebaseLocalBranch;
    constructor(readonly branchPath: string,
        readonly branchLog: RefLog,
        readonly headFinish: RefLog,
        readonly headLogs: RefLog[]) { }
    toString() {
        return `RebaseCurrentBranch`;
    }
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
    toString() {
        return `RebaseCurrentBranchInteractive`;
    }
    get end() {
        return this.branchLog.at;
    }
}

export class RebaseUnknownRefInteractive implements Operation {
    readonly type = OpType.rebaseUnknownInteractiveFinished;
    constructor(
        readonly headFinish: RefLog,
        readonly headLogs: RefLog[]) { }
    toString = dumpClassName;
    get end() {
        return this.headFinish.at;
    }
}

export class RebaseUnknownRefInteractiveAborted implements Operation {
    readonly type = OpType.rebaseUnknownInteractiveAborted;
    constructor(
        readonly headAbort: RefLog,
        readonly headLogs: RefLog[]) { }
    toString = dumpClassName;
    get end() {
        return this.headAbort.at;
    }
}

export class RebaseUnknownRefAborted implements Operation {
    readonly type = OpType.rebaseUnknownAborted;
    constructor(
        readonly headAbort: RefLog,
        readonly headLogs: RefLog[]) { }
    toString = dumpClassName;
    get end() {
        return this.headAbort.at;
    }
}

export class RebaseUnknownRefFinished implements Operation {
    readonly type = OpType.rebaseUnknownFinished;
    constructor(
        readonly headStart: RefLog,
        readonly headFinish: RefLog,
        readonly headLogs: RefLog[]) { }
    toString = dumpClassName;
    get end() {
        return this.headStart.at;
    }
}

export class RenameRemoteBranch implements Operation {
    readonly type = OpType.renameRemoteBranch;
    constructor(readonly branchPath: string,
        readonly branchLog: RefLog) { }
    toString() {
        return `RenameRemoteBranch`;
    }

    get end() {
        return this.branchLog.at;
    }
}