"use strict";
const tslib_1 = require("tslib");
const subprocess_1 = require("./subprocess");
const fs_promise_1 = require("fs-promise");
const path_1 = require("path");
/**
 * (you should open repo with this)
 */
function openRepo(start, gitBinary) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const repoRoot = yield findRepo(start, gitBinary);
        return new GitRepo(repoRoot, gitBinary);
    });
}
exports.openRepo = openRepo;
/**
 * find git repo (bare or not) from directory `start`
 * @param start string
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
    }
    listRefs() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
        });
    }
    readPackedRefs() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const filename = path_1.join(this.repoRoot, 'packed-refs');
            try {
                const lines = (yield fs_promise_1.readFile(filename, { encoding: "utf-8" })).split("\n");
                const result = [];
            }
            catch (e) {
            }
        });
    }
    /**
     * Local
     */
    readLocalHead() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
        });
    }
    watchRefs(callback) {
    }
}
//# sourceMappingURL=repo.js.map