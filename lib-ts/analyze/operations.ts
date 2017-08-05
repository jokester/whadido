import { detectRefpath, Timestamp, RefLog } from "../git";

/**
 * Recovered operations and text-ify
 */
const enum OpType {
    // remote branch
    push = 0,
    fetch,
    rename_remote,

    // head + local branch
    merge = 100,
    commit,
    create_branch,
    rebase_i_finished,
    rebase_i_aborted,
    rebase_finished,
    clone,

    // HEAD only
    checkout = 200,
    reset,

    // head + remote + local
    pull = 300,
}

export interface Operation {
    type: OpType;
    date: Timestamp;
}

function dumpObj(obj: Object) {
    const p1 = (obj.constructor as Function || UnknownClass).name;
    const p2 = JSON.stringify(obj);
    return `${p1}: ${p2}`;
}

function UnknownClass() { }

abstract class BasicOp implements Operation {
    readonly type: OpType;
    abstract get date(): Timestamp;
    toString() {
        return dumpObj(this);
    }
}

export class Merge extends BasicOp {
    type = OpType.merge;
    constructor(private headLog: RefLog,
        private refpath?: string, private branchLog?: RefLog) {
        super();
    }
    get date() {
        return this.headLog.at;
    }
}

export class Commit extends BasicOp {
    type = OpType.commit;
    constructor(private headLog: RefLog,
        private refpath?: string, private branchLog?: RefLog) {
        super();
    }
    get date() {
        return this.headLog.at;
    }
}

export class CreateBranch extends BasicOp {
    type = OpType.create_branch;
    constructor(private branchLog: RefLog,
        private branchPath: string, private headCheckout?: RefLog) {
        super();
    }
    get date() { return this.branchLog.at; }
}

export class Clone extends BasicOp {
    type = OpType.clone;
    constructor(private headLog: RefLog, private branchpath?: string, private branchLog?: RefLog) { super(); }
    get date() { return this.headLog.at; }
}

export class Fetch extends BasicOp {
    type = OpType.fetch;
    constructor(private refpath: string, private branchLog: RefLog) { super(); }

    get date() { return this.branchLog.at; }
}

export class Push extends BasicOp {
    type = OpType.push;
    constructor(private refpath: string, private branchLog: RefLog) { super(); }

    get date() { return this.branchLog.at; }
}

export class Pull extends BasicOp {
    type = OpType.pull;
    constructor(private headLog: RefLog) { super(); }
    get date() { return this.headLog.at; }
}

export class RenameRemote extends BasicOp {
    type = OpType.rename_remote;
    constructor(private refpath: string, private branchLog: RefLog) { super(); }
    get date() { return this.branchLog.at; }
}

export class Checkout extends BasicOp {
    type = OpType.checkout;
    constructor(private headLog: RefLog) { super(); }
    get date() { return this.headLog.at; }
}

export class Reset extends BasicOp {
    type = OpType.reset;
    constructor(private headLog: RefLog, private branchpath?: string, private branchLog?: RefLog) { super(); }
    get date() { return this.headLog.at; }
}

export class RebaseInteractiveFinished extends BasicOp {
    type = OpType.rebase_i_finished;
    constructor(private headLogs: RefLog[], private branchpath?: string, private branchLog?: RefLog) {
        super();
    }
    get date() { return this.headLogs[0].at; }
}

export class RebaseInteractiveAborted extends BasicOp {
    type = OpType.rebase_i_aborted;
    constructor(private headLogs: RefLog[]) {
        super();
    }
    get date() { return this.headLogs[0].at; }
}

export class RebaseFinished extends BasicOp {
    type = OpType.rebase_finished;
    constructor(private headLogs: RefLog[], private branchpath?: string, private branchLog?: RefLog) {
        super();
    }
    get date() { return this.headLogs[0].at; }
}
