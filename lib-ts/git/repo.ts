import { join, relative } from 'path';
import { spawn, ChildProcess } from 'child_process';

import { readFile, exists } from 'fs-promise';
import * as readdir from 'recursive-readdir';

import { GitRef, RefType, GitObject, ObjType } from './rawtypes';
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
 *
 */
class GitRepo {

    private readonly catRawObj: MutexResource<ChildProcess>;

    /**
     * @param gitBinary string name of git binary, can be just "git"
     */
    constructor(private readonly repoRoot: string,
        private readonly gitBinary: string) {

        this.catRawObj = new MutexResource(
            spawnChild(this.gitBinary,
                ['cat-file', '--batch'], { cwd: this.repoRoot }));
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

    async readObject(sha1: string): Promise<GitObject> {
        throw "TODO";
    }

    readObjRaw(sha1: string): Promise<string[]> {
        const PATTERNS = parser.PATTERNS;

        const readProgress = {
            // received by far
            readLength: 0,
            totalLength: 0,
            // first buffer contains the metadata
            buffers: [] as Buffer[],
        }

        // FIXME refactor readProgress and this s** to a buffer consumer/provider pattern
        return new Promise<string[]>((fulfill, reject) => {
            this.catRawObj.queue((release, child) => {

                const finish = () => {
                    child.stdout.removeAllListeners("data");
                    release();
                };

                child.stdout.on('data', (chunk: Buffer) => {
                    readProgress.buffers.push(chunk);

                    // read first chunk as metadata
                    if (!readProgress.totalLength) {
                        let matched;
                        const lines = chunkToLines(chunk);
                        if (matched = PATTERNS.raw_object.missing.exec(lines[0])) {
                            reject(new Error(`${sha1} missing`));
                            finish();
                        } else if (matched = PATTERNS.raw_object.metadata.exec(lines[0])) {
                            readProgress.totalLength = parseInt(matched[3]);
                        } else {
                            reject(new Error(`metadata not recognized: ${JSON.stringify(lines)}`));
                            finish();
                        }
                    } else {
                        // if obj exists, 2nd chunk (if any) contains actual object
                        readProgress.readLength += chunk.length;
                        if (readProgress.readLength >= readProgress.totalLength) {
                            let lines = [] as string[];
                            for (let bufNo = 1; bufNo < readProgress.buffers.length; bufNo++) {
                                lines = lines.concat(chunkToLines(readProgress.buffers[bufNo]));
                            }
                            fulfill(lines);
                            finish();
                        }
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
