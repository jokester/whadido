"use strict";
const tslib_1 = require("tslib");
const subprocess_1 = require("./subprocess");
const fs_promise_1 = require("fs-promise");
const path_1 = require("path");
const parser = require("./parser");
const logger = console;
/**
 * (you should open repo with this)
 */
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
 * @returns
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
 *
 */
class GitRepo {
    /**
     * @param gitBinary string name of git binary, can be just "git"
     */
    constructor(repoRoot, gitBinary) {
        this.repoRoot = repoRoot;
        this.gitBinary = gitBinary;
        logger.info(`GitRepo: repoRoot=${repoRoot}`);
    }
    /**
     * list (top-level) refs
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
    readPackedRefs() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const filename = path_1.join(this.repoRoot, 'packed-refs');
            const lines = (yield fs_promise_1.readFile(filename, { encoding: "utf-8" })).split("\n");
            return parser.parsePackedRef(lines);
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
    watchRefs(callback) {
    }
}
//# sourceMappingURL=repo.js.map