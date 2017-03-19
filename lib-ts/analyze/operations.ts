import { detectRefpath, Timestamp, RefLog } from "../git";

/**
 * Recovered operations and text-ify
 */

const enum OpType {
    // push a branch to remote repo
    remotePush = 0,

    localCheckout = 100,
    localCommitInBranch,
    localCommitAtBareHead,
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
