import * as path from "path";

// import { join, relative } from 'path';
import { spawn, ChildProcess } from 'child_process';


import { GitRef, RefType, GitObject, ObjType, GitObjectData, DetectObjType, GitATag } from './types';
import * as Git from './types';
import * as parser from './parser';
import {
    MutexResource, MutexResourcePool, ResourceHolder,
    chunkToLines, deprecate, ArrayM
} from '../util';
import * as io from '../util/io';
import { getSubprocessOutput } from '../util/subprocess';

export class GitRepoException extends Error { }

/**
 * open git repo
 * 
 * @export
 * @param {string} repoRoot absolute path of root, returned by `findRepo`
 * @param {string} [gitBinary="git"]
 * @returns {Promise<GitRepo>}
 */
export async function openRepo(start: string, gitBinary = "git"): Promise<IGitRepo> {
    const repoRoot = await findRepo(start, gitBinary);
    return new GitRepo(repoRoot, gitBinary);
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

export type ResolvedRef = (Git.GitRef | Git.GitObject)[];

/**
 * Public interface for GitRepo
 *
 * @interface IGitRepo
 */
interface IGitRepo {
    // normally `.git`
    readonly repoRoot: string;

    listRefs(): Promise<GitRef[]>;

    /**
     * resolve top-level ref for a (ref / object) chain
     */
    resolveRef(refpath: Git.GitRef): Promise<ResolvedRef>;

    /**
     * read reflog of a specified ref
     */
    // readReflog(refpath: string): Promise<Git.GitRefLog[]>;
}

namespace GitReader {

    /**
     * read reflog of a ref (branch or head)
     */
    export async function readReflog(repo: string, refpath: string) {
        const reflog_path = path.join(repo, 'logs', refpath);
        try {
            const lines = await io.readLines(reflog_path);
            return lines.filter(line => line).map(parser.parseReflog);
        } catch (e) {
            return [];
        }
    }

}


/**
 * Receive a series of chunks (from output of git cat-)
 */
class ObjReader {
    private readonly chunks: Buffer[] = [];
    private metadataSize = 0;
    private objSize = 0;
    private currentProgress = 0;
    private objType: ObjType;
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

    getObj(): GitObjectData {

        return {
            type: this.objType,
            sha1: this.objFullname,
            data: (this.objType === ObjType.COMMIT || this.objType === ObjType.ATAG) ? this.mergeBuffer() : null,
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
export class GitRepo implements IGitRepo {

    private readonly catRawObj: ResourceHolder<ChildProcess>;

    /**
     * @param gitBinary string name of git binary, can be just "git"
     */
    constructor(readonly repoRoot: string,
        readonly gitBinary: string) {

        if (1) {
            this.catRawObj = new MutexResource(
                spawn(this.gitBinary,
                    ['cat-file', '--batch',], { cwd: this.repoRoot }));
        } else {
            // not using pool for cat-file subprocess
            // it's almost always slower (why?)
            const v: ChildProcess[] = [];
            for (let c = 0; c < 5; c++) {
                v.push(spawn(this.gitBinary,
                    ['cat-file', '--batch',], { cwd: this.repoRoot }));
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
    async listRefs(): Promise<GitRef[]> {
        // FIXME: read in parallel?
        const localHead = await this.readLocalHead();
        const packed = await this.readPackedRefs();
        const unpacked = await this.readUnpackedRefs();
        return ([localHead]).concat(packed).concat(unpacked);
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
    async resolveRef(ref: GitRef): Promise<ResolvedRef> {
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
    }

    async getRefByPath(path: string): Promise<GitRef> {
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
    async resolveRef$head(ref: Git.GitRef): Promise<ResolvedRef> {
        if (parser.isSHA1(ref.dest)) {
            const destObj = await this.readObject(ref.dest);
            if (destObj.type === Git.ObjType.COMMIT)
                return [ref, destObj as Git.GitCommit];
        }

        if (parser.isDestBranch(ref.dest)) {
            const destBranch = await this.getRefByPath(ref.dest);
            const resolvedBranch = await this.resolveRef$branch(destBranch);
            return ([ref] as ResolvedRef).concat(resolvedBranch);
        }

        throw new Error(`resolveRef$head: HEAD not recognized: ${JSON.stringify(ref)}`);
    }

    /**
     * Resolves a branch ref:
     * - branch > commit
     */
    async resolveRef$branch(ref: Git.GitRef): Promise<ResolvedRef> {
        if (parser.isSHA1(ref.dest)) {
            const commit = await this.readObject(ref.dest);
            if (ref.type === Git.RefType.BRANCH && commit.type === Git.ObjType.COMMIT) {
                return [ref, commit];
            }
        }

        throw new Error(`resolveRef$branch: branch not recognized: ${JSON.stringify(ref)}`);
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
    async resolveRef$tag(ref: Git.GitRef): Promise<ResolvedRef> {
        const destObj = await this.readObject(ref.dest);
        if (destObj.type === Git.ObjType.COMMIT)
            return [ref, destObj];
        throw new GitRepoException(`resolveRef$tag(): tag must point to a object, got ${JSON.stringify(destObj)}`);
    }

    /**
     * Read packed refs
     * 
     * @returns {Promise<GitRef[]>} array of packed refs
     * 
     * @memberOf GitRepo
     *
     */
    async readPackedRefs(): Promise<GitRef[]> {
        const filename = path.join(this.repoRoot, 'packed-refs');
        try {
            const lines = await io.readLines(filename);
            const got = parser.parsePackedRef(lines);
            return got;
        } catch (e) {
            return [] as GitRef[];
        }
    }

    /**
     * Local 
     */
    async readLocalHead(): Promise<GitRef> {
        const filename = path.join(this.repoRoot, "HEAD");
        const lines = await io.readLines(filename);
        return parser.parseHEAD(lines[0]);
    }

    /**
     * Read non-packed refs
     * 
     * @private
     * @returns {Promise<GitRef[]>}
     * 
     * @memberOf GitRepo
     */
    async readUnpackedRefs(): Promise<GitRef[]> {
        const PATTERNS = parser.PATTERNS;
        const start = path.join(this.repoRoot, 'refs');
        const refFiles = await io.recursiveReadDir(start);
        const found = [] as GitRef[];

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
            } else {
                throw new Error(`failed to parse ref file: '${fRelative}'`);
            }
        }

        return found;
    }

    /**
     * Read and parse git object
     *
     * @param {string} sha1
     * @returns {Promise<GitObject>}
     *
     * @memberOf GitRepo
     */
    async readObject(sha1: string): Promise<GitObject> {
        const objRaw = await this.readObjRaw(sha1);
        switch (objRaw.type) {
            case ObjType.COMMIT:
                return parser.parseCommit(objRaw.sha1, chunkToLines(objRaw.data));
            case ObjType.ATAG:
                return parser.parseAnnotatedTag(objRaw.sha1, chunkToLines(objRaw.data));
            case ObjType.BLOB:
            case ObjType.TREE:
                return { type: objRaw.type, sha1: sha1 };
        }
        throw new Error(`objType not recognized: ${objRaw.type}`);
    }

    /**
     *
     *
     * @param {string} sha1
     * @returns {Promise<ObjReader>}
     *
     * @memberOf GitRepo
     */
    async readObjRaw(sha1: string): Promise<GitObjectData> {
        const objReader = new ObjReader(sha1);

        return new Promise<GitObjectData>((fulfill, reject) => {
            this.catRawObj.queue((release, child) => {

                const finish = () => {
                    child.stdout.removeAllListeners("data");
                    release();
                };

                child.stdout.on('data', (chunk: Buffer) => {
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
}
