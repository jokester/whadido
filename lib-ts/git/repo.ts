import * as path from "path";
import * as lodash from "lodash";

// import { join, relative } from 'path';
import { spawn, ChildProcess } from "child_process";

import { Ref, Obj, Annotation, RefLog } from "./types";
import * as parser from "./parser";
import {
    MutexResource, MutexResourcePool, ResourceHolder,
    deprecate,
} from "../common/util";
import {chunkToLines, } from "../common/io/text";
import * as io from "../common/io";
import { recursiveReadDir } from "../util";
import { getSubprocessOutput } from "../common/util/subprocess";

export class GitRepoException extends Error { }

function sortRefByPath(a: Ref.Unknown, b: Ref.Unknown) {
    if (a.path > b.path)
        return 1;
    else if (a.path < b.path)
        return -1;
    return 0;
}


/**
 * open git repo
 *
 * @export
 * @param {string} repoRoot absolute path of root, returned by `findRepo`
 * @param {string} [gitBinary="git"]
 * @returns {Promise<GitRepo>}
 */
export async function openRepo(start: string, gitBinary = "git"): Promise<GitRepo> {
    const repoRoot = await findRepo(start, gitBinary);
    return new GitRepoImpl(repoRoot, gitBinary);
}

/**
 * find git repo (bare or not) from directory `start`
 *
 * @export
 * @param {string} start the directory to start
 * @param {string} [gitBinary="git"] binary of git
 * @returns absolute path of the repo
 */
export async function findRepo(start: string, gitBinary = "git") {

    // `git rev-parse --git-dir` prints path of $PWD
    const status = await getSubprocessOutput(gitBinary,
                                             ["rev-parse", "--absolute-git-dir"],
    { cwd: start }
                                            );

                                            // find first absolute path
                                            for (const l of status.stdout) {
                                                if (l.match(/^\//))
                                                    return l;
                                            }

                                            throw new GitRepoException(`findGitRepo(): cannot find git repo for ${start}. got ${JSON.stringify(status)} from 'git rev-parse'`);
}

export type ResolvedRef = Ref.Tag | Ref.Atag | Ref.Head | Ref.Branch;

/**
 * Public interface for GitRepo
 *
 * @interface IGitRepo
 */
export interface GitRepo {
    // normally `.git`
    readonly repoRoot: string;

    listRefs(): Promise<Ref.Unknown[]>;

    /**
     * resolve ref by 1 level
     */
    resolveRef(refpath: Ref.Unknown): Promise<ResolvedRef>;

    /**
     * walks from a ref, until a non-ref object is found
     */
    resolveTag(ref: Ref.Tag | Ref.Atag): Promise<Obj.Object>;

    readObj(sha1: string): Promise<Obj.Object>;
    /**
     * read reflog of a specified ref
     */
    readReflog(refpath: string): Promise<RefLog[]>;
}

/**
 * Receive a series of chunks (from output of git cat-)
 */
class ObjReader {
    private readonly chunks: Buffer[] = [];
    private metadataSize = 0;
    private objSize = 0;
    private currentProgress = 0;
    private objType: Obj.Type;
    private objFullname: string;

    constructor(readonly name: string) { }

    /**
     * Feed a new buffer into ObjReader
     *
     * @param {Buffer} chunk a chunk emitted from stdout of `git cat-file --batch` object
     * @returns {boolean} whether reading is complete
     *
     * @memberOf ObjReader
     */
    feed(chunk: Buffer): boolean {
        if (chunk.byteLength === 1 && chunk[0] === 10)
            return;
        this.chunks.push(chunk);
        this.currentProgress += chunk.length;

        if (this.chunks.length === 1) {
            this.readMetaData(chunk);
        }

        return (this.currentProgress >= (this.objSize + this.metadataSize));
    }

    getObj(): Obj.ObjectData {

        return {
            type: this.objType,
            sha1: this.objFullname,
            data: (this.objType === Obj.Type.COMMIT || this.objType === Obj.Type.ATAG) ? this.mergeBuffer() : null,
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
    private mergeBuffer(): Buffer {
        // Concatenate all buffers and remove metadata
        const allBuffer = Buffer.concat(this.chunks, this.currentProgress);
        return allBuffer.slice(this.metadataSize, this.metadataSize + this.objSize);
    }

    // Read metadata (obj type / size) from first buffer
    private readMetaData(firstChunk: Buffer) {
        const maybeMetadata = chunkToLines(firstChunk);
        // first non-empty line
        const metadataLine = maybeMetadata.find(l => !!l);
        if (!metadataLine) {
            throw new GitRepoException(`metadata not found: ${JSON.stringify(firstChunk)} / ${JSON.stringify(chunkToLines(firstChunk))}`);
        } else if (parser.PATTERNS.raw_object.missing.exec(metadataLine)) {
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
export class GitRepoImpl implements GitRepo {

    private readonly catRawObj: ResourceHolder<ChildProcess>;

    /**
     * @param gitBinary string name of git binary, can be just "git"
     */
    constructor(readonly repoRoot: string,
                readonly gitBinary: string) {

                    if (1) {
                        this.catRawObj = new MutexResource(
                            spawn(this.gitBinary,
                                  ["cat-file", "--batch", ], { cwd: this.repoRoot }));
                    } else {
                        // not using pool for cat-file subprocess
                        // it's almost always slower (why?)
                        const v: ChildProcess[] = [];
                        for (let c = 0; c < 5; c++) {
                            v.push(spawn(this.gitBinary,
                                         ["cat-file", "--batch", ], { cwd: this.repoRoot }));
                        }
                        this.catRawObj = new MutexResourcePool(v);
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
                async listRefs(): Promise<Ref.Unknown[]> {
                    const localHead = this.readLocalHead();
                    const packed = this.readPackedRefs();
                    const unpacked = this.readUnpackedRefs();
                    // when a ref exists in both unpacked and packed, unpacked version takes precedencse
                    const concated: Ref.Unknown[] = ([await localHead]).concat(await unpacked).concat(await packed);

                    return lodash.uniqBy(concated, "path");
                }

                /**
                 * Resolve ref by 1 level
                 *
                 * @param {GitRef} ref
                 *
                 * @memberOf GitRepo
                 */
                async resolveRef(ref: Ref.Unknown): Promise<ResolvedRef> {
                    switch (ref.type) {
                        case Ref.Type.HEAD:
                            return this.resolveRef$head(ref);
                        case Ref.Type.BRANCH:
                            return this.resolveRef$branch(ref);
                        case Ref.Type.UNKNOWN_TAG:
                            return this.resolveRef$unknown_tag(ref);
                        // tag / atag is not supported
                        // user should resolve that by hand, with readObj()
                    }
                    throw new GitRepoException(`resolveRef: cannot resolve ref: ${JSON.stringify(ref)}`);
                }

                async getRefByPath(path: string): Promise<Ref.Unknown> {
                    const refs = await this.listRefs();
                    for (const r of refs) {
                        if (r.path === path)
                            return r;
                    }
                    throw new GitRepoException(`getRefByPath: failed to found refs for ${path}. Had ${JSON.stringify(refs)}`);
                }

                /**
                 * Resolves a HEAD ref:
                 * - head > branch > commit
                 * - head > commit
                 * reject if not recognized
                 * @param ref
                 */
                async resolveRef$head(ref: Ref.Unknown): Promise<Ref.Head> {
                    if (parser.isSHA1(ref.dest)) {
                        const destObj = await this.readObject(ref.dest);
                        if (destObj.type === Obj.Type.COMMIT) {
                            const head: Ref.Head = Object.assign({}, ref, { destCommit: destObj.sha1 });
                            return head;
                        }
                    }

                    if (parser.isDestBranch(ref.dest)) {
                        const destBranch = await this.getRefByPath(ref.dest);
                        const head: Ref.Head = Object.assign({}, ref, { destBranch: ref.dest });
                        return head;
                    }

                    throw new Error(`resolveRef$head: HEAD not recognized: ${JSON.stringify(ref)}`);
                }

                /**
                 * Resolves a branch ref:
                 * - branch > commit
                 */
                async resolveRef$branch(ref: Ref.Unknown): Promise<Ref.Branch> {
                    if (parser.isSHA1(ref.dest)) {
                        const commit = await this.readObject(ref.dest);
                        if (ref.type === Ref.Type.BRANCH && commit.type === Obj.Type.COMMIT) {
                            const branch: Ref.Branch = Object.assign({}, ref, { destCommit: commit.sha1 });
                            return branch;
                        }
                    }

                    throw new Error(`resolveRef$branch: branch not recognized: ${JSON.stringify(ref)}`);
                }


                /**
                 * A non-annotated tag must point to a commit.
                 * Technically a shallow tag can point to any object, we are not supporting this.
                 *
                 * @param {Ref.Unknown} ref
                 * @returns {Promise<Ref.GitAtagRef | Ref.GitTagRef>}
                 *
                 * @memberof GitRepo
                 */
                async resolveRef$unknown_tag(ref: Ref.Unknown): Promise<Ref.Atag | Ref.Tag> {
                    const destObj = await this.readObject(ref.dest);

                    if (destObj.type === Obj.Type.ATAG) {
                        // a annotated tag
                        return this.resolveRef$atag(ref);
                    } else {
                        // a shallow tag
                        return this.resolveRef$tag(ref);
                    }
                }

                /**
                 * A non-annotated tag must point to a commit.
                 * Technically a shallow tag can point to any object, we are not supporting this.
                 *
                 * @param {Git.GitRef} ref
                 * @returns {Promise<Git.GitTagRef>}
                 *
                 * @memberof GitRepo
                 */
                async resolveRef$tag(ref: Ref.Unknown): Promise<Ref.Tag> {
                    const destObj = await this.readObject(ref.dest);
                    const newRef: Ref.Tag = Object.assign({}, ref, { type: Ref.Type.TAG, destObj: ref.dest });
                    return newRef;
                }

                async resolveRef$atag(ref: Ref.Unknown): Promise<Ref.Atag> {
                    const atagObj = await this.readObject(ref.dest);

                    if (Obj.isAnnotatedTag(atagObj)) {
                        const nextObj = await this.readObject(atagObj.dest);

                        const annoContent: Annotation = {
                            sha1: atagObj.sha1,
                            by: atagObj.tagger,
                            message: atagObj.message,
                            at: atagObj.tagged_at,
                        };

                        const annotatedRef: Ref.Atag = {
                            dest: atagObj.sha1,
                            destObj: atagObj.dest,
                            destType: atagObj.destType,
                            path: ref.path,
                            type: Ref.Type.ATAG,
                            annotation: annoContent,
                        };

                        return annotatedRef;
                    }

                    throw new GitRepoException("resolveRef$atag(): destObj is not atag");
                }

                /**
                 * Local
                 */
                async readLocalHead(): Promise<Ref.Head> {
                    const filename = path.join(this.repoRoot, "HEAD");
                    const lines = await io.readLines(filename);
                    return parser.parseHEAD(lines[0]);
                }

                /**
                 * Read packed refs
                 *
                 * @returns {Promise<GitRef[]>} array of packed refs
                 *
                 * @memberOf GitRepo
                 *
                 */
                async readPackedRefs(): Promise<Ref.Unknown[]> {
                    const filename = path.join(this.repoRoot, "packed-refs");
                    try {
                        const lines = await io.readLines(filename);
                        const got = parser.parsePackedRef(lines);
                        return got;
                    } catch (e) {
                        return [];
                    }
                }

                /**
                 * Read non-packed refs
                 *
                 * @private
                 * @returns {Promise<GitRef[]>}
                 *
                 * @memberOf GitRepo
                 */
                async readUnpackedRefs(): Promise<Ref.Unknown[]> {
                    const PATTERNS = parser.PATTERNS;
                    const start = path.join(this.repoRoot, "refs");
                    const refFiles = await recursiveReadDir(start);
                    const found = [] as Ref.Unknown[];

                    for (const f of refFiles) {
                        // relative path like `refs/heads/...`
                        const fRelative = path.relative(this.repoRoot, f);
                        const lines = await io.readLines(f);

                        if (PATTERNS.refpath.remote_head.exec(fRelative)) {
                            const p = parser.parseHEAD(lines[0], fRelative);
                            found.push(p);
                        } else if (PATTERNS.refpath.remote_branch.exec(fRelative)) {
                            const p = parser.parseBranch(lines[0], fRelative);
                            found.push(p);
                        } else if (PATTERNS.refpath.local_branch.exec(fRelative)) {
                            const p = parser.parseBranch(lines[0], fRelative);
                            found.push(p);
                        } else if (PATTERNS.refpath.tag.exec(fRelative)) {
                            const p = parser.parseTag(lines[0], fRelative);
                            found.push(p);
                        } else if (fRelative === "refs/stash") {
                            /* ignore stash TODO: support stash */
                        } else {
                            throw new Error(`failed to parse ref file: '${fRelative}'`);
                        }
                    }

                    return found.sort(sortRefByPath);
                }

                /**
                 * Read and parse git object
                 *
                 * @param {string} sha1
                 * @returns {Promise<GitObject>}
                 *
                 * @memberOf GitRepo
                 */
                async readObject(sha1: string): Promise<Obj.Object> {
                    const objRaw = await this.readObjRaw(sha1);
                    switch (objRaw.type) {
                        case Obj.Type.COMMIT:
                            return parser.parseCommit(objRaw.sha1, chunkToLines(objRaw.data));
                        case Obj.Type.ATAG:
                            return parser.parseAnnotatedTag(objRaw.sha1, chunkToLines(objRaw.data));
                        case Obj.Type.BLOB:
                            case Obj.Type.TREE:
                            return { type: objRaw.type, sha1: sha1 };
                    }
                    throw new Error(`objType not recognized: ${objRaw.type}`);
                }

                readObj(sha1: string) {
                    return this.readObject(sha1);
                }

                /**
                 *
                 *
                 * @param {string} sha1
                 * @returns {Promise<ObjReader>}
                 *
                 * @memberOf GitRepo
                 */
                async readObjRaw(sha1: string): Promise<Obj.ObjectData> {
                    const objReader = new ObjReader(sha1);

                    return new Promise<Obj.ObjectData>((fulfill, reject) => {
                        this.catRawObj.queue((release, child) => {

                            const finish = () => {
                                child.stdout.removeAllListeners("data");
                                release();
                            };

                            child.stdout.on("data", (chunk: Buffer) => {
                                try {
                                    const finished = objReader.feed(chunk);
                                    if (finished) {
                                        finish();
                                        fulfill(objReader.getObj());
                                    }
                                } catch (e) {
                                    reject(e);
                                    finish();
                                }
                            });

                            child.stdin.write(`${sha1}\n`, (err: Error) => {
                                if (err) {
                                    reject(err);
                                    finish();
                                }
                            });
                        });
                    });
                }

                /**
                 * read reflog of a ref (branch or head)
                 */
                async readReflog(refpath: string): Promise<RefLog[]> {
                    const reflog_path = path.join(this.repoRoot, "logs", refpath);
                    try {
                        const lines = await io.readLines(reflog_path);
                        return lines.filter(line => !!line).map(parser.parseReflog);
                    } catch (e) {
                        return [];
                    }
                }

                async resolveTag(tag: Ref.Tag | Ref.Atag): Promise<Obj.Object> {
                    let sha1 = tag.destObj;
                    while (true) {
                        const obj = await this.readObj(sha1);
                        if (Obj.isAnnotatedTag(obj)) {
                            sha1 = obj.dest;
                        } else {
                            return obj;
                        }
                    }
                }
}
