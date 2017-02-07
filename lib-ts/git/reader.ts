/**
 * Low level git operations.
 * 
 * @copyright Wang Guan
 */

const path = require('path');

import * as errors from '../errors';
import { readLines, isTruthy, liftA2, deprecate } from '../util';

import {
    getSubprocessOutput, rejectNonZeroReturn
} from './subprocess';

import {
    GitCommit, GitRefLog, GitHuman, GitTimestamp, GitRef,
    GitObject, RefType, ObjType
} from './rawtypes';

import * as parser from './parser';

/**
 * @deprecated should be per-instance
 */
const gitBinary = 'git';

/**
 * read reflog of a ref (branch or head)
 */
export async function readReflog(repo: string, refname: string) {
    const reflog_path = path.join(repo, 'logs', refname);
    try {
        const lines = await readLines(reflog_path);
        return lines.filter(isTruthy).map(parser.parseReflog);
    } catch (e) {
        return [];
    }
}

/**
 * read local or remote HEAD
 */
export async function readHead(repo: string, refname: string): Promise<void> {
    const head_path = path.join(repo, refname);
    const head_lines = await readLines(head_path);

    const l0 = head_lines[0];

    if (!l0)
        throw new Error(`readLocalHead: not recognized ${l0}`);
    else if (parser.isCommitSHA1(l0)) {
        // return new Object(refname, l0);
    } else {
        const branch_name = parser.parseHEAD(l0);
        // return new GitHead(refname, branch_name);
    }
}

/**
 * read a local or remote branch
 */
function readBranch(repo: string, name: string): Promise<void> {
    return null;
}

/**
 *
 */
function readTag(repo: string, name: string): Promise<void> {
    return null;
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

export async function readRefs(repo: string) {
    const result = await getSubprocessOutput(gitBinary, ['for-each-ref'], { cwd: repo })
        .then(rejectNonZeroReturn);
    const refNames = parser.parseRefList(result.stdout);

    const refs = [] as any[];

    for (const r of refNames) {
        if (r.type === RefType.TAG) {
            refs.push(await readTag(repo, r.name));
        } else if (r.type === RefType.HEAD) {
            refs.push(await readHead(repo, r.name));
        } else if (r.type === RefType.BRANCH) {
            refs.push(await readBranch(repo, r.name));
        }
    }

    return refs;
}

export function catFile(repo: string, ref: string) {

    const cat = getSubprocessOutput(gitBinary,
        [
            `--git-dir=${repo}`,
            'cat-file',
            '-p',
            ref
        ]
    );

    return cat.then(rejectNonZeroReturn).then(status => status.stdout);
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