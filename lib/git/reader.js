"use strict";
/**
 * Low level git operations.
 *
 * @copyright Wang Guan
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path = require("path");
const util_1 = require("../util");
const subprocess_1 = require("../util/subprocess");
const parser = require("./parser");
util_1.deprecate();
const gitBinary = "git";
/**
 * read local or remote HEAD
 */
function readHead(repo, refname) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const head_path = path.join(repo, refname);
        const head_lines = yield util_1.readLines(head_path);
        const l0 = head_lines[0];
        if (!l0)
            throw new Error(`readHead(): not recognized ${l0}`);
        else if (parser.isSHA1(l0)) {
            // return new Object(refname, l0);
        }
        else {
            const branch_name = parser.parseHEAD(l0);
            // return new GitHead(refname, branch_name);
        }
    });
}
exports.readHead = readHead;
/**
 *
 */
function readCommit(repo, sha1) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const result = yield subprocess_1.getSubprocessOutput(gitBinary, ['cat-file', '-p', sha1])
            .then(subprocess_1.rejectNonZeroReturn);
        return parser.parseCommit(sha1, result.stdout);
    });
}
/**
 *
 */
function readObject(repo, sha1, gitBinary) {
    return subprocess_1.getSubprocessOutput(gitBinary, ['cat-file', '-p', sha1])
        .then(subprocess_1.rejectNonZeroReturn).then(result => result.stdout);
}
exports.readObject = readObject;
/**
 * list (non-recognized) references
 *
 * @deprecated git for-each-ref resolves dependency on its own,
 * while we want to handle that by own
 */
function listRefs(repo) {
    util_1.deprecate();
    return subprocess_1.getSubprocessOutput(gitBinary, ['for-each-ref'], { cwd: repo })
        .then(subprocess_1.rejectNonZeroReturn)
        .then(result => parser.parseRefList(result.stdout));
}
exports.listRefs = listRefs;
class GitReader {
    constructor(repo) {
        this.repo = repo;
        util_1.deprecate();
    }
    getCatfileProcess() {
    }
    /**
     * "whatever" can be:
     * - commit sha1
     * - ref (local/remote) (branch/tag/annotated tag)
     *
     * returns:
     *
     * - (annotated) tag
     * - commit
     *
     * or, rejects:
     * - not found ("missing")
     * - not a tag or commit (e.g. blob/tree)
     */
    catObject(whatever) {
        // NOTE git cat-file only prints *resolved*
        // e.g. a non-
        return Promise.resolve("");
    }
    /**
     * @returns one of:
     *  - a commit      e.g
     *  - not found (reject)
     *  - a branch ref (like in HEAD)
     */
    readRef(whatever) {
        return null;
    }
}
exports.GitReader = GitReader;
//# sourceMappingURL=reader.js.map