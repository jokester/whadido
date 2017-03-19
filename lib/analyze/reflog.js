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
const defaultAnalyzeFlags = {
    remotePush: true,
    remoteFetch: true,
};
function analyzeDump(dumps, flags = defaultAnalyzeFlags) {
    const map0 = build(dumps);
    flags = flags || defaultAnalyzeFlags;
    const remoteBranchNames = Array.from(map0.keys())
        .filter(k => git_1.detectRefpath.remote_branch.exec(k));
    const pushRemoteBranch = flags.remotePush ? remoteBranchNames.map(pushRemoteBranch1) : [];
    const fetchRemoteBranch = flags.remoteFetch ? remoteBranchNames.map(fetchRemoteBranch1) : [];
    const parser = parser_1.reiterate(parser_1.biased(...pushRemoteBranch, ...fetchRemoteBranch));
    return parser(map0);
}
exports.analyzeDump = analyzeDump;
/**
 * Push to a remote branch: "update by push"
 */
const pushRemoteBranch1 = (refPath) => ((input) => {
    const ref = input.get(refPath);
    const lastLog = lodash.last(ref.reflog);
    if (!(lastLog && /^update by push/.exec(lastLog.desc)))
        return [];
    const rest = Object.assign({}, ref, { reflog: lodash.initial(ref.reflog) });
    return [{
            output: new Op.RemotePush(refPath, lastLog),
            rest: input.set(refPath, rest)
        }];
});
const fetchRemoteBranch1 = (refPath) => ((input) => {
    const ref = input.get(refPath);
    const lastLog = lodash.last(ref.reflog);
    if (!(lastLog && /^fetch\W/.exec(lastLog.desc)))
        return [];
    const rest = Object.assign({}, ref, { reflog: lodash.initial(ref.reflog) });
    return [{
            output: new Op.RemoteFetch(refPath, lastLog),
            rest: input.set(refPath, rest)
        }];
});
//# sourceMappingURL=reflog.js.map