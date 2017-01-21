/**
 * Low level git operations.
 *
 * @copyright Wang Guan
 */

const path = require('path');
const fs = require('fs');

import * as errors from '../errors';
import { readLines, isTruthy, liftA2 } from '../util';

import {
    spawnSubprocess, rejectNonZeroReturn
} from './subprocess';

import {
    GitBranch, GitCommit, GitRefLog, GitHuman, GitTimestamp, GitHead, GitBareHead, GitRef,
    GitObject, RefType, ObjType, GitTag,
} from './git-types';

import * as parser from './parser';

const gitBinary = 'git';

/**
 * find git repo (bare or not) from `start`
 */
export async function findGitRepo(start: string) {

    // `git rev-parse --git-dir` prints  of $PWD

    const status = await spawnSubprocess(gitBinary,
        ["rev-parse", "--git-dir"],
        { cwd: start }
    ).then(rejectNonZeroReturn);

    // return first line only if line 2 is empty
    if (status.stdout.length === 2 && !status.stdout[1])
        return status.stdout[0];

    throw new Error(`findGitRepo: cannot find git repo for ${start}. got ${JSON.stringify(status.stdout)} from 'git rev-parse'`);
}

/**
 * read reflog of a ref (branch or head)
 */
export async function readReflog(repo: string, refname: string) {
    const reflog_path = path.join(repo, 'logs', refname);
    const lines = await readLines(reflog_path);
    return lines.filter(isTruthy).map(parser.parseReflog);
}

/**
 * read local or remote HEAD
 */
export async function readHead(repo: string, refname: string): Promise<GitHead | GitBareHead> {
    const head_path = path.join(repo, refname);
    const head_lines = await readLines(head_path);

    const l0 = head_lines[0];

    if (!l0)
        throw new Error(`readLocalHead: not recognized ${l0}`);
    else if (parser.isCommitSHA1(l0)) {
        return new GitBareHead(refname, l0);
    } else {
        const branch_name = parser.extractRef(l0);
        return new GitHead(refname, branch_name);
    }
}

/**
 * read a local or remote branch
 */
function readBranch(repo: string, name: string): Promise<GitBranch> {
    return null;
}

/**
 *
 */
function readTag(repo: string, name: string): Promise<GitTag> {
    return null;
}

/**
 *
 */
async function readCommit(repo: string, sha1: string) {
    const result = await spawnSubprocess(gitBinary, ['cat-file', '-p', sha1])
        .then(rejectNonZeroReturn);
    return parser.parseRawCommit(sha1, result.stdout);
}

/**
 *
 */
function readObject(repo: string, sha1: string): Promise<string[]> {
    return spawnSubprocess(gitBinary, ['cat-file', '-p', sha1])
        .then(rejectNonZeroReturn).then(result => result.stdout);
}

/**
 * list (non-recognized) references
 */
export function listRefs(repo: string) {
    return spawnSubprocess(gitBinary, ['for-each-ref'], { cwd: repo })
        .then(rejectNonZeroReturn)
        .then(result => parser.parseRefList(result.stdout))
}

export async function readRefs(repo: string) {
    const result = await spawnSubprocess(gitBinary, ['for-each-ref'], { cwd: repo })
        .then(rejectNonZeroReturn);
    const refNames = parser.parseRefList(result.stdout);

    const refs = [] as GitRef[];

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

    const cat = spawnSubprocess(gitBinary,
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
    catFile(whatever: string): Promise<string> {
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