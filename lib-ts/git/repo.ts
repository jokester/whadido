import {
    spawnSubprocess, rejectNonZeroReturn
} from './subprocess';

import { readFile, exists } from 'fs-promise';
import { join } from 'path';
import { GitRef } from './rawtypes';
import * as parser from './parser';

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
 * @returns
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
 *
 */
class GitRepo {
    /**
     * @param gitBinary string name of git binary, can be just "git"
     */
    constructor(private readonly repoRoot: string,
        private readonly gitBinary: string) {
        logger.info(`GitRepo: repoRoot=${repoRoot}`);
    }

    /**
     * list (top-level) refs
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

    private async readPackedRefs() {
        const filename = join(this.repoRoot, 'packed-refs');
        const lines = (await readFile(filename, { encoding: "utf-8" })).split("\n");
        return parser.parsePackedRef(lines);
    }

    /**
     * Local 
     */
    private async readLocalHead(): Promise<GitRef> {
        const filename = join(this.repoRoot, "HEAD");
        const lines = (await readFile(filename, { encoding: "utf-8" })).split("\n");
        return parser.parseHEAD(lines[0]);
    }

    watchRefs(callback: Function) {

    }
}
