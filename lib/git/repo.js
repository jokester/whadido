"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path = require("path");
// import { join, relative } from 'path';
const child_process_1 = require("child_process");
const Git = require("./types");
const parser = require("./parser");
const util_1 = require("../util");
const io = require("../util/io");
const subprocess_1 = require("../util/subprocess");
class GitRepoException extends Error {
}
exports.GitRepoException = GitRepoException;
/**
 * open git repo
 *
 * @export
 * @param {string} repoRoot absolute path of root, returned by `findRepo`
 * @param {string} [gitBinary="git"]
 * @returns {Promise<GitRepo>}
 */
function openRepo(start, gitBinary = "git") {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const repoRoot = yield findRepo(start, gitBinary);
        return new GitRepo(repoRoot, gitBinary);
    });
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
        const status = yield subprocess_1.getSubprocessOutput(gitBinary, ["rev-parse", "--absolute-git-dir"], { cwd: start });
        // find first absolute path
        for (const l of status.stdout) {
            if (l.match(/^\//))
                return l;
        }
        throw new GitRepoException(`findGitRepo(): cannot find git repo for ${start}. got ${JSON.stringify(status)} from 'git rev-parse'`);
    });
}
exports.findRepo = findRepo;
var GitReader;
(function (GitReader) {
    /**
     * read reflog of a ref (branch or head)
     */
    function readReflog(repo, refpath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const reflog_path = path.join(repo, 'logs', refpath);
            try {
                const lines = yield io.readLines(reflog_path);
                return lines.filter(line => line).map(parser.parseReflog);
            }
            catch (e) {
                return [];
            }
        });
    }
    GitReader.readReflog = readReflog;
})(GitReader || (GitReader = {}));
/**
 * Receive a series of chunks (from output of git cat-)
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
     *
     * @memberOf ObjReader
     */
    feed(chunk) {
        if (chunk.byteLength === 1 && chunk[0] === 10)
            return;
        this.chunks.push(chunk);
        this.currentProgress += chunk.length;
        if (this.chunks.length === 1) {
            this.readMetaData(chunk);
        }
        return (this.currentProgress >= (this.objSize + this.metadataSize));
    }
    getObj() {
        return {
            type: this.objType,
            sha1: this.objFullname,
            data: (this.objType === 1 /* COMMIT */ || this.objType === 2 /* ATAG */) ? this.mergeBuffer() : null,
        };
    }
    /**
     * Get whole raw-object as a buffer
     *
     * (You should only call this after feed() returns true)
     *
     * @returns {Buffer}
     *
     * @memberOf ObjReader
     */
    mergeBuffer() {
        // Concatenate all buffers and remove metadata
        const allBuffer = Buffer.concat(this.chunks, this.currentProgress);
        return allBuffer.slice(this.metadataSize, this.metadataSize + this.objSize);
    }
    // Read metadata (obj type / size) from first buffer
    readMetaData(firstChunk) {
        const maybeMetadata = util_1.chunkToLines(firstChunk);
        // first non-empty line
        const metadataLine = maybeMetadata.find(l => !!l);
        if (!metadataLine) {
            throw new GitRepoException(`metadata not found: ${JSON.stringify(firstChunk)} / ${JSON.stringify(util_1.chunkToLines(firstChunk))}`);
        }
        else if (parser.PATTERNS.raw_object.missing.exec(metadataLine)) {
            throw new GitRepoException(`object ${JSON.stringify(this.name)} is missing`);
        }
        // FIXME: maybe we should check whether sha1/name is ambigious (may happen in huge repo)
        const matched = parser.PATTERNS.raw_object.metadata.exec(metadataLine);
        if (!matched) {
            new GitRepoException(`metadata not recognized: ${JSON.stringify(metadataLine)}`);
        }
        // +1 for the \n of metadata line
        this.metadataSize = metadataLine.length + 1;
        // NOTE we can read objtype and its actual type here
        this.objSize = parseInt(matched[3]);
        this.objFullname = matched[1];
        this.objType = parser.ObjTypeMappings[matched[2]];
        if (!this.objType) {
            throw new GitRepoException(`object type not recognized: '${matched[2]}'`);
        }
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
        if (1) {
            this.catRawObj = new util_1.MutexResource(child_process_1.spawn(this.gitBinary, ['cat-file', '--batch',], { cwd: this.repoRoot }));
        }
        else {
            // not using pool for cat-file subprocess
            // it's almost always slower (why?)
            const v = [];
            for (let c = 0; c < 5; c++) {
                v.push(child_process_1.spawn(this.gitBinary, ['cat-file', '--batch',], { cwd: this.repoRoot }));
            }
            this.catRawObj = new util_1.MutexResourcePool(v);
        }
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
            // FIXME: read in parallel?
            const localHead = yield this.readLocalHead();
            const packed = yield this.readPackedRefs();
            const unpacked = yield this.readUnpackedRefs();
            return ([localHead]).concat(packed).concat(unpacked);
        });
    }
    /**
     * Resolve ref until a non-ref object is met
     *
     * @param {GitRef} ref
     * @returns {Promise<ResolvedRef>} The array for resolved ref.
     * The last object in array will be a non-ref object (e.g. commit/tree/blob)
     *
     * @memberOf GitRepo
     */
    resolveRef(ref) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            switch (ref.type) {
                case Git.RefType.HEAD:
                    return this.resolveRef$head(ref);
                case Git.RefType.BRANCH:
                    return this.resolveRef$branch(ref);
                case Git.RefType.TAG:
                    return this.resolveRef$tag(ref);
            }
            // throw "not implemented";
            // if (parser.isDestBranch(ref.dest)) {
            //     const resolved = [ref] as ResolvedRef;
            //     const next = await this.getRefByPath(ref.dest);
            //     return resolved.concat(await this.resolveRef(next));
            // } else if (parser.isSHA1(ref.dest)) {
            //     const destObj = await this.readObject(ref.dest);
            //     if (DetectObjType.isAnnotatedTag(destObj)) {
            //         // reconstruct a GitRef from object
            //         const destObjAsRef: GitRef = {
            //             type: RefType.ATAG,
            //             path: `refs/tags/${destObj.name}`,
            //             dest: destObj.dest
            //         };
            //         return ([destObj] as ResolvedRef).concat(await this.resolveRef(destObjAsRef));
            //     } else {
            //         const resolved = [ref] as ResolvedRef;
            //         return resolved.concat([destObj]);
            //     }
            // } else
            throw new GitRepoException(`resolveRef: cannot resolve ref: ${JSON.stringify(ref)}`);
        });
    }
    getRefByPath(path) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const refs = yield this.listRefs();
            for (const r of refs) {
                if (r.path === path)
                    return r;
            }
            throw new GitRepoException(`getRefByPath: failed to found refs for ${path}. Had ${JSON.stringify(refs)}`);
        });
    }
    /**
     * Resolves a HEAD ref:
     * - head > branch > commit
     * - head > commit
     * reject if not recognized
     * @param ref
     */
    resolveRef$head(ref) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (parser.isSHA1(ref.dest)) {
                const destObj = yield this.readObject(ref.dest);
                if (destObj.type === 1 /* COMMIT */)
                    return [ref, destObj];
            }
            if (parser.isDestBranch(ref.dest)) {
                const destBranch = yield this.getRefByPath(ref.dest);
                const resolvedBranch = yield this.resolveRef$branch(destBranch);
                return [ref].concat(resolvedBranch);
            }
            throw new Error(`resolveRef$head: HEAD not recognized: ${JSON.stringify(ref)}`);
        });
    }
    /**
     * Resolves a branch ref:
     * - branch > commit
     */
    resolveRef$branch(ref) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (parser.isSHA1(ref.dest)) {
                const commit = yield this.readObject(ref.dest);
                if (ref.type === Git.RefType.BRANCH && commit.type === 1 /* COMMIT */) {
                    return [ref, commit];
                }
            }
            throw new Error(`resolveRef$branch: branch not recognized: ${JSON.stringify(ref)}`);
        });
    }
    /**
     * A non-annotated tag must point to a commit.
     * Technically a shallow tag can point to any object, we are not supporting this.
     *
     * @param {Git.GitRef} ref
     * @returns {Promise<ResolvedRef>}
     *
     * @memberof GitRepo
     */
    resolveRef$tag(ref) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const destObj = yield this.readObject(ref.dest);
            if (destObj.type === 1 /* COMMIT */)
                return [ref, destObj];
            throw new GitRepoException(`resolveRef$tag(): tag must point to a object, got ${JSON.stringify(destObj)}`);
        });
    }
    /**
     * Read packed refs
     *
     * @returns {Promise<GitRef[]>} array of packed refs
     *
     * @memberOf GitRepo
     *
     */
    readPackedRefs() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const filename = path.join(this.repoRoot, 'packed-refs');
            try {
                const lines = yield io.readLines(filename);
                const got = parser.parsePackedRef(lines);
                return got;
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
            const filename = path.join(this.repoRoot, "HEAD");
            const lines = yield io.readLines(filename);
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
    readUnpackedRefs() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const PATTERNS = parser.PATTERNS;
            const start = path.join(this.repoRoot, 'refs');
            const refFiles = yield io.recursiveReadDir(start);
            const found = [];
            for (const f of refFiles) {
                // relative path like `refs/heads/...`
                const fRelative = path.relative(this.repoRoot, f);
                const lines = yield io.readLines(f);
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
                    throw new Error(`failed to parse ref file: '${fRelative}'`);
                }
            }
            return found;
        });
    }
    /**
     * Read and parse git object
     *
     * @param {string} sha1
     * @returns {Promise<GitObject>}
     *
     * @memberOf GitRepo
     */
    readObject(sha1) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const objRaw = yield this.readObjRaw(sha1);
            switch (objRaw.type) {
                case 1 /* COMMIT */:
                    return parser.parseCommit(objRaw.sha1, util_1.chunkToLines(objRaw.data));
                case 2 /* ATAG */:
                    return parser.parseAnnotatedTag(objRaw.sha1, util_1.chunkToLines(objRaw.data));
                case 4 /* BLOB */:
                case 3 /* TREE */:
                    return { type: objRaw.type, sha1: sha1 };
            }
            throw new Error(`objType not recognized: ${objRaw.type}`);
        });
    }
    /**
     *
     *
     * @param {string} sha1
     * @returns {Promise<ObjReader>}
     *
     * @memberOf GitRepo
     */
    readObjRaw(sha1) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
                                fulfill(objReader.getObj());
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
        });
    }
}
exports.GitRepo = GitRepo;
//# sourceMappingURL=repo.js.map