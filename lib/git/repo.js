"use strict";
const tslib_1 = require("tslib");
const fs_promise_1 = require("fs-promise");
const path_1 = require("path");
const readdir = require("recursive-readdir");
const parser = require("./parser");
const subprocess_1 = require("./subprocess");
/**
 * open git repo
 *
 * @export
 * @param {string} repoRoot absolute path of root, returned by `findRepo`
 * @param {string} [gitBinary="git"]
 * @returns {Promise<GitRepo>}
 */
function openRepo(repoRoot, gitBinary = "git") {
    // const repoRoot = await findRepo(repoRoot, gitBinary);
    return new GitRepo(repoRoot, gitBinary);
}
exports.openRepo = openRepo;
/**
 * find git repo (bare or not) from directory `start`
 *
 * @export
 * @param {string} start the directory to start
 * @param {string} [gitBinary="git"] binary of git
 * @returns absolute path of the repo
 */
function findRepo(start, gitBinary = "git") {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // `git rev-parse --git-dir` prints path of $PWD
        const status = yield subprocess_1.spawnSubprocess(gitBinary, ["rev-parse", "--git-dir"], { cwd: start }).then(subprocess_1.rejectNonZeroReturn);
        // if line 2 is empty, return the first line
        if (status.stdout.length === 2 && !status.stdout[1])
            return status.stdout[0];
        throw new Error(`findGitRepo: cannot find git repo for ${start}. got ${JSON.stringify(status.stdout)} from 'git rev-parse'`);
    });
}
exports.findRepo = findRepo;
/**
 * List (normally REPO/refs)
 *
 * @export
 * @returns {Promise<string[]>} absolute path of ref files
 */
function listRefFiles(start) {
    return new Promise((fulfill, reject) => {
        readdir(start, (err, files) => {
            if (err)
                reject(err);
            else
                fulfill(files);
        });
    });
}
exports.listRefFiles = listRefFiles;
/**
 * read lines from a file
 *
 * @param {string} filename
 * @returns {Promise<string[]>}
 */
function readLines(filename) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return (yield fs_promise_1.readFile(filename, { encoding: "utf-8" })).split("\n");
    });
}
/**
 *
 */
class GitRepo {
    /**
     * @param gitBinary string name of git binary, can be just "git"
     */
    constructor(repoRoot, gitBinary) {
        this.repoRoot = repoRoot;
        this.gitBinary = gitBinary;
    }
    /**
     * list all (top-level, unresolved) refs
     *
     * @returns {Promise<GitRef[]>} ref
     *
     * @memberOf GitRepo
     */
    listRefs() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const packed = yield this.readPackedRefs();
            const localHead = yield this.readLocalHead();
            return ([localHead])
                .concat(packed);
        });
    }
    /**
     * Read packed refs
     *
     * @private
     * @returns {Promise<GitRef[]>} array of packed refs
     *
     * @memberOf GitRepo
     */
    readPackedRefs() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const filename = path_1.join(this.repoRoot, 'packed-refs');
            try {
                const lines = (yield fs_promise_1.readFile(filename, { encoding: "utf-8" })).split("\n");
                return parser.parsePackedRef(lines);
            }
            catch (e) {
                return [];
            }
        });
    }
    /**
     * Local
     */
    readLocalHead() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const filename = path_1.join(this.repoRoot, "HEAD");
            const lines = (yield fs_promise_1.readFile(filename, { encoding: "utf-8" })).split("\n");
            return parser.parseHEAD(lines[0]);
        });
    }
    /**
     * Read non-packed refs
     *
     * @private
     * @returns {Promise<GitRef[]>}
     *
     * @memberOf GitRepo
     */
    readNonpackedRef() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const PATTERNS = parser.PATTERNS;
            const start = path_1.join(this.repoRoot, 'refs');
            const refFiles = yield listRefFiles(start);
            const found = [];
            for (const f of refFiles) {
                // relative path like `refs/heads/...`
                const fRelative = path_1.relative(this.repoRoot, f);
                const lines = yield readLines(f);
                if (PATTERNS.refpath.remote_head.exec(fRelative)) {
                    const p = parser.parseHEAD(lines[0], fRelative);
                    found.push(p);
                }
                else if (PATTERNS.refpath.remote_branch.exec(fRelative)) {
                    const p = parser.parseBranch(lines[0], fRelative);
                    found.push(p);
                }
                else if (PATTERNS.refpath.local_branch.exec(fRelative)) {
                    const p = parser.parseBranch(lines[0], fRelative);
                    found.push(p);
                }
                else if (PATTERNS.refpath.tag.exec(fRelative)) {
                    const p = parser.parseTag(lines[0], fRelative);
                    found.push(p);
                }
                else {
                    throw new Error(`failed to parse ref: '${fRelative}'`);
                }
            }
            return found;
        });
    }
    watchRefs(callback) {
    }
}
//# sourceMappingURL=repo.js.map