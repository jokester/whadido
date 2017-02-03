/**
 * Low level git operations.
 *
 * @copyright Wang Guan
 */
"use strict";
const tslib_1 = require("tslib");
const path = require('path');
const util_1 = require("../util");
const subprocess_1 = require("./subprocess");
const rawtypes_1 = require("./rawtypes");
const parser = require("./parser");
/**
 * @deprecated should be per-instance
 */
const gitBinary = 'git';
/**
 * read reflog of a ref (branch or head)
 */
function readReflog(repo, refname) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const reflog_path = path.join(repo, 'logs', refname);
        try {
            const lines = yield util_1.readLines(reflog_path);
            return lines.filter(util_1.isTruthy).map(parser.parseReflog);
        }
        catch (e) {
            return [];
        }
    });
}
exports.readReflog = readReflog;
/**
 * read local or remote HEAD
 */
function readHead(repo, refname) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const head_path = path.join(repo, refname);
        const head_lines = yield util_1.readLines(head_path);
        const l0 = head_lines[0];
        if (!l0)
            throw new Error(`readLocalHead: not recognized ${l0}`);
        else if (parser.isCommitSHA1(l0)) {
        }
        else {
            const branch_name = parser.parseHEAD(l0);
        }
    });
}
exports.readHead = readHead;
/**
 * read a local or remote branch
 */
function readBranch(repo, name) {
    return null;
}
/**
 *
 */
function readTag(repo, name) {
    return null;
}
/**
 *
 */
function readCommit(repo, sha1) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const result = yield subprocess_1.spawnSubprocess(gitBinary, ['cat-file', '-p', sha1])
            .then(subprocess_1.rejectNonZeroReturn);
        return parser.parseCommit(sha1, result.stdout);
    });
}
/**
 *
 */
function readObject(repo, sha1, gitBinary) {
    return subprocess_1.spawnSubprocess(gitBinary, ['cat-file', '-p', sha1])
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
    return subprocess_1.spawnSubprocess(gitBinary, ['for-each-ref'], { cwd: repo })
        .then(subprocess_1.rejectNonZeroReturn)
        .then(result => parser.parseRefList(result.stdout));
}
exports.listRefs = listRefs;
function readRefs(repo) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const result = yield subprocess_1.spawnSubprocess(gitBinary, ['for-each-ref'], { cwd: repo })
            .then(subprocess_1.rejectNonZeroReturn);
        const refNames = parser.parseRefList(result.stdout);
        const refs = [];
        for (const r of refNames) {
            if (r.type === rawtypes_1.RefType.TAG) {
                refs.push(yield readTag(repo, r.name));
            }
            else if (r.type === rawtypes_1.RefType.HEAD) {
                refs.push(yield readHead(repo, r.name));
            }
            else if (r.type === rawtypes_1.RefType.BRANCH) {
                refs.push(yield readBranch(repo, r.name));
            }
        }
        return refs;
    });
}
exports.readRefs = readRefs;
function catFile(repo, ref) {
    const cat = subprocess_1.spawnSubprocess(gitBinary, [
        `--git-dir=${repo}`,
        'cat-file',
        '-p',
        ref
    ]);
    return cat.then(subprocess_1.rejectNonZeroReturn).then(status => status.stdout);
}
exports.catFile = catFile;
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