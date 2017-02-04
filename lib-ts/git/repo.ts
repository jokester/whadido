import { join, relative } from 'path';
import { spawn, ChildProcess } from 'child_process';

import { readFile, exists } from 'fs-promise';
import * as readdir from 'recursive-readdir';

import { GitRef, RefType, GitObject, ObjType, GitObjectData } from './rawtypes';
import * as parser from './parser';
import * as reader from './reader';
import {
    spawnSubprocess, rejectNonZeroReturn, spawnChild
} from './subprocess';
import { MutexResource, chunkToLines, deprecate, } from '../util';

/**
 * open git repo
 * 
 * @export
 * @param {string} repoRoot absolute path of root, returned by `findRepo`
 * @param {string} [gitBinary="git"]
 * @returns {Promise<GitRepo>}
 */
export function openRepo(repoRoot: string, gitBinary = "git"): GitRepo {
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
    const status = await spawnSubprocess(gitBinary,
        ["rev-parse", "--git-dir"],
        { cwd: start }
    ).then(rejectNonZeroReturn);

    // if line 2 is empty, return the first line
    if (status.stdout.length === 2 && !status.stdout[1])
        return status.stdout[0];

    throw new Error(`findGitRepo: cannot find git repo for ${start}. got ${JSON.stringify(status.stdout)} from 'git rev-parse'`);
}

/**
 * List (normally REPO/refs)
 * 
 * @export
 * @returns {Promise<string[]>} absolute path of ref files
 */
export function listRefFiles(start: string): Promise<string[]> {
    return new Promise<string[]>((fulfill, reject) => {
        readdir(start, (err, files) => {
            if (err)
                reject(err);
            else
                fulfill(files);
        });
    });
}

/**
 * read lines from a file
 * 
 * @param {string} filename
 * @returns {Promise<string[]>}
 */
async function readLines(filename: string): Promise<string[]> {
    return (await readFile(filename, { encoding: "utf-8" })).split("\n");
}

type ResolvedRef = (GitRef | GitObject)[];

// refs indexed by name
type RefDict = { [refpath: string]: GitRef }

/**
 * Receive a series of chunks
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
     * @throws {Error} if the object cannot be found
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
            throw new Error(`metadata not found: ${JSON.stringify(firstChunk)} / ${JSON.stringify(chunkToLines(firstChunk))}`);
        } else if (parser.PATTERNS.raw_object.missing.exec(metadataLine)) {
            throw new Error(`object ${JSON.stringify(this.name)} is missing`);
        }

        // FIXME check whether sha1/name is ambigious (may happen in huge repo)

        const matched = parser.PATTERNS.raw_object.metadata.exec(metadataLine);
        if (!matched) {
            new Error(`metadata not recognized: ${JSON.stringify(metadataLine)}`);
        }

        // +1 for the \n of metadata line
        this.metadataSize = metadataLine.length + 1;
        // NOTE we can read objtype and its actual type here
        this.objSize = parseInt(matched[3]);
        this.objFullname = matched[1];
        this.objType = parser.ObjTypeMappings[matched[2]];
        if (!this.objType) {
            throw new Error(`object type not recognized: ${matched[2]}`);
        }
    }
}

/**
 *
 */
export class GitRepo {

    private readonly catRawObj: MutexResource<ChildProcess>;

    /**
     * @param gitBinary string name of git binary, can be just "git"
     */
    constructor(readonly repoRoot: string,
        readonly gitBinary: string) {

        this.catRawObj = new MutexResource(
            spawnChild(this.gitBinary,
                ['cat-file', '--batch',], { cwd: this.repoRoot }));
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
        })
    }

    /**
     * list and refresh all (top-level, unresolved) refs
     * 
     * @returns {Promise<GitRef[]>} ref
     * 
     * @memberOf GitRepo
     */
    async listRefs(): Promise<GitRef[]> {
        // FIXME can fewer await improve performance?
        const packed = await this.readPackedRefs();
        const nonpacked = await this.readNonpackedRef();
        const localHead = await this.readLocalHead();
        return ([localHead]).concat(packed).concat(nonpacked);
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
    async resolveRef(ref: GitRef): Promise<ResolvedRef> {
        if (parser.isRefSymDest(ref.dest)) {
            const next = await this.getRefByPath(ref.dest);
            return ([ref] as any[]).concat(await this.resolveRef(next));
        } else if (parser.isCommitSHA1) {
            // const next = 
        }
        return []
    }

    async getRefByPath(path: string): Promise<GitRef> {
        const refs = await this.listRefs();
        for (const r of refs) {
            if (r.path === path)
                return r;
        }
        throw new Error(`getRefByPath: failed to found refs for ${path}. Had ${JSON.stringify(refs)}`);
    }

    /**
     * Read packed refs
     * 
     * @private
     * @returns {Promise<GitRef[]>} array of packed refs
     * 
     * @memberOf GitRepo
     */
    private async readPackedRefs(): Promise<GitRef[]> {
        const filename = join(this.repoRoot, 'packed-refs');
        try {
            const lines = (await readFile(filename, { encoding: "utf-8" })).split("\n");
            return parser.parsePackedRef(lines);
        } catch (e) {
            return [] as GitRef[];
        }
    }

    /**
     * Local 
     */
    private async readLocalHead(): Promise<GitRef> {
        const filename = join(this.repoRoot, "HEAD");
        const lines = (await readFile(filename, { encoding: "utf-8" })).split("\n");
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
    private async readNonpackedRef(): Promise<GitRef[]> {
        const PATTERNS = parser.PATTERNS;
        const start = join(this.repoRoot, 'refs');
        const refFiles = await listRefFiles(start);
        const found = [] as GitRef[];

        for (const f of refFiles) {
            // relative path like `refs/heads/...`
            const fRelative = relative(this.repoRoot, f);
            const lines = await readLines(f);

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
                throw new Error(`failed to parse ref: '${fRelative}'`);
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
            default:
                throw new Error(`objType not recognized: ${objRaw.type}`);
        }
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

    watchRefs(callback: Function) {

    }
}
