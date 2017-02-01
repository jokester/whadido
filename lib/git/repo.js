"use strict";
const tslib_1 = require("tslib");
const path_1 = require("path");
const fs_promise_1 = require("fs-promise");
const readdir = require("recursive-readdir");
const parser = require("./parser");
const subprocess_1 = require("./subprocess");
const util_1 = require("../util");
/**
 * open git repo
 *
 * @export
 * @param {string} repoRoot absolute path of root, returned by `findRepo`
 * @param {string} [gitBinary="git"]
 * @returns {Promise<GitRepo>}
 */
function openRepo(repoRoot, gitBinary = "git") {
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
 * Receive a series of chunks
 */
class ObjReader {
    constructor(name) {
        this.name = name;
        this.chunks = [];
        this.metadataSize = 0;
        this.objSize = 0;
        this.currentProgress = 0;
    }
    /**
     * Feed a new buffer into ObjReader
     *
     * @param {Buffer} chunk a chunk emitted from stdout of `git cat-file --batch` object
     * @returns {boolean} whether reading is complete
     * @throws {Error} if the object cannot be found
     *
     * @memberOf ObjReader
     */
    feed(chunk) {
        this.chunks.push(chunk);
        this.currentProgress += chunk.length;
        if (this.chunks.length === 1) {
            this.readMetaData(chunk);
        }
        return (this.currentProgress >= (this.objSize + this.metadataSize));
    }
    getRawObj() {
        // Concatenate all buffers and remove metadata
        const allBuffer = Buffer.concat(this.chunks, this.currentProgress);
        return allBuffer.slice(this.metadataSize);
    }
    getParsedObj() {
        // TODO parse buffers
        return null;
    }
    // Read metadata (obj type / size) from first buffer
    readMetaData(firstChunk) {
        const metadataLine = util_1.chunkToLines(firstChunk)[0];
        if (!metadataLine) {
            throw new Error(`metadata not found`);
        }
        else if (parser.PATTERNS.raw_object.missing.exec(metadataLine)) {
            throw new Error(`object ${this.name} is missing`);
        }
        const matched = parser.PATTERNS.raw_object.metadata.exec(metadataLine);
        if (!matched) {
            new Error(`metadata not recognized: ${JSON.stringify(metadataLine)}`);
        }
        // +1 for the \n of metadata line
        this.metadataSize = metadataLine.length + 1;
        // NOTE we can read objtype and its actual type here
        this.objSize = parseInt(matched[3]);
    }
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
        this.catRawObj = new util_1.MutexResource(subprocess_1.spawnChild(this.gitBinary, ['cat-file', '--batch'], { cwd: this.repoRoot }));
    }
    /**
     * Free all resources
     *
     * FIXME we may be able to replace this with a adaptive subprocess pool?
     *
     * @memberOf GitRepo
     */
    dispose() {
        this.catRawObj.queue((release, proc) => {
            proc.kill();
            release();
        });
    }
    /**
     * list and refresh all (top-level, unresolved) refs
     *
     * @returns {Promise<GitRef[]>} ref
     *
     * @memberOf GitRepo
     */
    listRefs() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // FIXME can fewer await improve performance?
            const packed = yield this.readPackedRefs();
            const nonpacked = yield this.readNonpackedRef();
            const localHead = yield this.readLocalHead();
            return ([localHead]).concat(packed).concat(nonpacked);
        });
    }
    /**
     * Resolve ref until a non-ref object
     *
     * @param {GitRef} ref
     * @returns {Promise<ResolvedRef>} The array for resolved ref.
     * The last object in array will be a non-ref object (e.g. commit/tree/blob)
     *
     * @memberOf GitRepo
     */
    resolveRef(ref) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (parser.isRefSymDest(ref.dest)) {
                const next = yield this.getRefByPath(ref.dest);
                return [ref].concat(yield this.resolveRef(next));
            }
            else if (parser.isCommitSHA1) {
            }
            return [];
        });
    }
    getRefByPath(path) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const refs = yield this.listRefs();
            for (const r of refs) {
                if (r.path === path)
                    return r;
            }
            throw new Error(`getRefByPath: failed to found refs for ${path}. Had ${JSON.stringify(refs)}`);
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
    readObject(sha1) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            throw "TODO";
        });
    }
    readObjRaw(sha1) {
        const objReader = new ObjReader(sha1);
        return new Promise((fulfill, reject) => {
            this.catRawObj.queue((release, child) => {
                const finish = () => {
                    child.stdout.removeAllListeners("data");
                    release();
                };
                child.stdout.on('data', (chunk) => {
                    try {
                        const finished = objReader.feed(chunk);
                        if (finished) {
                            finish();
                            fulfill(util_1.chunkToLines(objReader.getRawObj()));
                        }
                    }
                    catch (e) {
                        reject(e);
                        finish();
                    }
                });
                child.stdin.write(`${sha1}\n`, (err) => {
                    if (err) {
                        reject(err);
                        finish();
                    }
                });
            });
        });
    }
    watchRefs(callback) {
    }
}
//# sourceMappingURL=repo.js.map