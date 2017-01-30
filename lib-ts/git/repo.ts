import { readFile, exists } from 'fs-promise';
import { join, relative } from 'path';
import * as readdir from 'recursive-readdir';

import { GitRef, RefType } from './rawtypes';
import * as parser from './parser';
import {
    spawnSubprocess, rejectNonZeroReturn
} from './subprocess';

/**
 * open git repo
 * 
 * @export
 * @param {string} repoRoot absolute path of root, returned by `findRepo`
 * @param {string} [gitBinary="git"]
 * @returns {Promise<GitRepo>}
 */
export function openRepo(repoRoot: string, gitBinary = "git"): GitRepo {
    // const repoRoot = await findRepo(repoRoot, gitBinary);
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

/**
 *
 */
class GitRepo {
    /**
     * @param gitBinary string name of git binary, can be just "git"
     */
    constructor(private readonly repoRoot: string,
        private readonly gitBinary: string) {
    }

    /**
     * list all (top-level, unresolved) refs
     * 
     * @returns {Promise<GitRef[]>} ref
     * 
     * @memberOf GitRepo
     */
    async listRefs(): Promise<GitRef[]> {
        const packed = await this.readPackedRefs();
        const localHead = await this.readLocalHead();
        return ([localHead])
            .concat(packed);
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

    watchRefs(callback: Function) {

    }
}
