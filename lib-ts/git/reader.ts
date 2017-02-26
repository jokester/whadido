/**
 * Low level git operations.
 * 
 * @copyright Wang Guan
 */



import * as path from "path";
import * as errors from '../errors';
import { readLines, isTruthy, liftA2, deprecate } from '../util';

import {
    getSubprocessOutput, rejectNonZeroReturn
} from '../util/subprocess';

import {
    GitCommit, GitRefLog, GitHuman, GitTimestamp, GitRef,
    GitObject, RefType, ObjType
} from './types';

import * as parser from './parser';

deprecate();

const gitBinary = "git";

/**
 * read local or remote HEAD
 */
export async function readHead(repo: string, refname: string): Promise<void> {
    const head_path = path.join(repo, refname);
    const head_lines = await readLines(head_path);

    const l0 = head_lines[0];

    if (!l0)
        throw new Error(`readHead(): not recognized ${l0}`);
    else if (parser.isSHA1(l0)) {
        // return new Object(refname, l0);
    } else {
        const branch_name = parser.parseHEAD(l0);
        // return new GitHead(refname, branch_name);
    }
}


/**
 *
 */
async function readCommit(repo: string, sha1: string) {
    const result = await getSubprocessOutput(gitBinary, ['cat-file', '-p', sha1])
        .then(rejectNonZeroReturn);
    return parser.parseCommit(sha1, result.stdout);
}

/**
 *
 */
export function readObject(repo: string, sha1: string, gitBinary: string): Promise<string[]> {
    return getSubprocessOutput(gitBinary, ['cat-file', '-p', sha1])
        .then(rejectNonZeroReturn).then(result => result.stdout);
}

/**
 * list (non-recognized) references
 * 
 * @deprecated git for-each-ref resolves dependency on its own,
 * while we want to handle that by own
 */
export function listRefs(repo: string) {
    deprecate();
    return getSubprocessOutput(gitBinary, ['for-each-ref'], { cwd: repo })
        .then(rejectNonZeroReturn)
        .then(result => parser.parseRefList(result.stdout))
}



export class GitReader {

    constructor(private repo: string) {
        deprecate();
    }

    getCatfileProcess() {

    }

    /**
     * "whatever" can be:
     * - commit sha1
     * - ref (local/remote) (branch/tag/annotated tag)
     * 
     * returns:
     * 
     * - (annotated) tag
     * - commit
     * 
     * or, rejects:
     * - not found ("missing")
     * - not a tag or commit (e.g. blob/tree)
     */
    catObject(whatever: string): Promise<string> {
        // NOTE git cat-file only prints *resolved*
        // e.g. a non-
        return Promise.resolve("");
    }

    /**
     * @returns one of:
     *  - a commit      e.g
     *  - not found (reject)
     *  - a branch ref (like in HEAD)
     */
    readRef(whatever: string): Promise<string> {
        return null;
    }
}