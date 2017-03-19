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
//# sourceMappingURL=operations.js.map