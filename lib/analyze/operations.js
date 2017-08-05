"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function dumpObj(obj) {
    const p1 = (obj.constructor || UnknownClass).name;
    const p2 = JSON.stringify(obj);
    return `${p1}: ${p2}`;
}
function UnknownClass() { }
class BasicOp {
    toString() {
        return dumpObj(this);
    }
}
class Merge extends BasicOp {
    constructor(headLog, refpath, branchLog) {
        super();
        this.headLog = headLog;
        this.refpath = refpath;
        this.branchLog = branchLog;
        this.type = 100 /* merge */;
    }
    get date() {
        return this.headLog.at;
    }
}
exports.Merge = Merge;
class Commit extends BasicOp {
    constructor(headLog, refpath, branchLog) {
        super();
        this.headLog = headLog;
        this.refpath = refpath;
        this.branchLog = branchLog;
        this.type = 101 /* commit */;
    }
    get date() {
        return this.headLog.at;
    }
}
exports.Commit = Commit;
class CreateBranch extends BasicOp {
    constructor(branchLog, branchPath, headCheckout) {
        super();
        this.branchLog = branchLog;
        this.branchPath = branchPath;
        this.headCheckout = headCheckout;
        this.type = 102 /* create_branch */;
    }
    get date() { return this.branchLog.at; }
}
exports.CreateBranch = CreateBranch;
class Clone extends BasicOp {
    constructor(headLog, branchpath, branchLog) {
        super();
        this.headLog = headLog;
        this.branchpath = branchpath;
        this.branchLog = branchLog;
        this.type = 106 /* clone */;
    }
    get date() { return this.headLog.at; }
}
exports.Clone = Clone;
class Fetch extends BasicOp {
    constructor(refpath, branchLog) {
        super();
        this.refpath = refpath;
        this.branchLog = branchLog;
        this.type = 1 /* fetch */;
    }
    get date() { return this.branchLog.at; }
}
exports.Fetch = Fetch;
class Push extends BasicOp {
    constructor(refpath, branchLog) {
        super();
        this.refpath = refpath;
        this.branchLog = branchLog;
        this.type = 0 /* push */;
    }
    get date() { return this.branchLog.at; }
}
exports.Push = Push;
class Pull extends BasicOp {
    constructor(headLog) {
        super();
        this.headLog = headLog;
        this.type = 300 /* pull */;
    }
    get date() { return this.headLog.at; }
}
exports.Pull = Pull;
class RenameRemote extends BasicOp {
    constructor(refpath, branchLog) {
        super();
        this.refpath = refpath;
        this.branchLog = branchLog;
        this.type = 2 /* rename_remote */;
    }
    get date() { return this.branchLog.at; }
}
exports.RenameRemote = RenameRemote;
class Checkout extends BasicOp {
    constructor(headLog) {
        super();
        this.headLog = headLog;
        this.type = 200 /* checkout */;
    }
    get date() { return this.headLog.at; }
}
exports.Checkout = Checkout;
class Reset extends BasicOp {
    constructor(headLog, branchpath, branchLog) {
        super();
        this.headLog = headLog;
        this.branchpath = branchpath;
        this.branchLog = branchLog;
        this.type = 201 /* reset */;
    }
    get date() { return this.headLog.at; }
}
exports.Reset = Reset;
class RebaseInteractiveFinished extends BasicOp {
    constructor(headLogs, branchpath, branchLog) {
        super();
        this.headLogs = headLogs;
        this.branchpath = branchpath;
        this.branchLog = branchLog;
        this.type = 103 /* rebase_i_finished */;
    }
    get date() { return this.headLogs[0].at; }
}
exports.RebaseInteractiveFinished = RebaseInteractiveFinished;
class RebaseInteractiveAborted extends BasicOp {
    constructor(headLogs) {
        super();
        this.headLogs = headLogs;
        this.type = 104 /* rebase_i_aborted */;
    }
    get date() { return this.headLogs[0].at; }
}
exports.RebaseInteractiveAborted = RebaseInteractiveAborted;
class RebaseFinished extends BasicOp {
    constructor(headLogs, branchpath, branchLog) {
        super();
        this.headLogs = headLogs;
        this.branchpath = branchpath;
        this.branchLog = branchLog;
        this.type = 105 /* rebase_finished */;
    }
    get date() { return this.headLogs[0].at; }
}
exports.RebaseFinished = RebaseFinished;
//# sourceMappingURL=operations.js.map