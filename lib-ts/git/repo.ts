import {
    spawnSubprocess, rejectNonZeroReturn
} from './subprocess';

import { readdir } from 'fs-promise';

/**
 * (you should open repo with this)
 */
export async function openRepo(start: string, gitBinary: string): Promise<GitRepo> {
    const repoRoot = await findRepo(start, gitBinary);
    return new GitRepo(repoRoot, gitBinary);
}

/**
 * find git repo (bare or not) from directory `start`
 * @param start string
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

    }

    async listRefs() {


    }

    watchRefs(callback: Function) {

    }
}
