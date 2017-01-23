/**
 * (pure & sync) parsers for git raw format
 */
import {
    RefType, GitRef,
    ObjType, GitObject,
    GitCommit, GitCommitMutable,
    GitRefLog, GitHuman, GitTimestamp,
} from './rawtypes';
import { isTruthy, deepFreeze, freeze } from '../util';

export const PATTERNS = freeze({
    refpath: freeze({
        local_head: /^HEAD$/,
        local_branch: /^refs\/heads\//,
        remote_branch: /^refs\/remotes\/[^\/]+\/(?!HEAD$)/,
        remote_head: /^refs\/remotes\/[^\/]+\/HEAD$/,
        tag: /^refs\/tags\//,
        // all: /(head|\/)/i,
    }),

    // line printed from 'git for-each-ref'
    ref_line: /^([0-9a-zA-Z]{40})\s+(commit|tag)\s+(.*)$/i,

    reflog_line: /^([0-9a-zA-Z]{40})\s+([0-9a-zA-Z]{40})\s+(.*)\s+(\d+\s+[+-]\d+)\t(.*)$/,
    //             ^from-sha1          ^to-sha1            ^author      ^time         ^message

    date: /^(\d+)\s+([+-]\d+)$/,
    //      timestamp  timezone

    //        name    mail
    author: /^(.*)\s+<(.+@.+)>$/,

    head: freeze({
        //              dest
        refname: /^ref: (.*)$/,
    }),

    commit_sha1: /^[0-9a-zA-Z]{40}$/,

    commit: {
        tree: /^tree [0-9a-zA-Z]{40}$/,
        parent: /^parent ([0-9a-zA-Z]{40})$/,
        author: /^author (.*)\s+(\d+\s+[+-]\d+)$/,
        committer: /^committer (.*)\s+(\d+\s+[+-]\d+)$/,
    }
});


/**
 * parse date like '1480181019 +0500'
 */
export function parseDate(dateStr: string): GitTimestamp {
    const d = PATTERNS.date.exec;
    const matches = PATTERNS.date.exec(dateStr);

    if (!matches) {
        throw `date not recognized: ${JSON.stringify(dateStr)}`;
    }

    const timestamp = parseInt(matches[1]);
    const timezone = matches[2];
    return {
        utc_sec: timestamp,
        tz: timezone
    }
}

export function isCommitSHA1(line: string) {
    return !!line.match(PATTERNS.commit_sha1);
}

/**
 * extract refname from content of HEAD
 */
export function extractRef(line: string) {
    const match = line.match(PATTERNS.head.refname);
    if (!match)
        throw new Error(`extractRef: ref not found in ${line}`);
    return match[1];
}

/**
 * parse author like "Wang Guan <momocraft@gmail.com>"
 */
export function parseAuthor(str: string): GitHuman {
    const match = PATTERNS.author.exec(str);
    if (match) {
        return {
            name: match[1],
            email: match[2]
        }
    } else {
        return {
            name: str,
            email: ''
        }
    }
}

/**
 * parse one line in reflog (e.g. .git/logs/HEAD)
 */
export function parseReflog(line: string): GitRefLog {
    const matches = PATTERNS.reflog_line.exec(line);

    if (!matches) {
        throw `reflog not recognized: ${JSON.stringify(line)}`;
    }

    return {
        from: matches[1],
        to: matches[2],
        by: parseAuthor(matches[3]),
        at: parseDate(matches[4]),
        desc: matches[5]
    }
}

interface UnknownGitRef {
    readonly name: string
    readonly type: RefType
    readonly dest: string
}

/**
 * parse output of `git for-each-ref`
 */
export function parseRefList(ref_lines: string[]): UnknownGitRef[] {
    const refs: UnknownGitRef[] = [];
    for (const line of ref_lines.filter(isTruthy)) {

        const matched = line.match(PATTERNS.ref_line);

        const dest_sha1 = matched[1];
        const dest_type = matched[2];
        const refname = matched[3];

        if (dest_type === "commit"
            && PATTERNS.refpath.remote_head.exec(refname)) {
            refs.push({ name: refname, type: RefType.HEAD, dest: dest_sha1 });
            continue;
        } else if (dest_type === "commit"
            && PATTERNS.refpath.local_branch.exec(refname)) {
            refs.push({ name: refname, type: RefType.BRANCH, dest: dest_sha1 });
            continue;
        } else if (dest_type === "commit"
            && PATTERNS.refpath.remote_branch.exec(refname)) {
            refs.push({ name: refname, type: RefType.BRANCH, dest: dest_sha1 });
            continue;
        } else if (PATTERNS.refpath.tag.exec(refname)) {
            refs.push({ name: refname, type: RefType.TAG, dest: dest_sha1 });
            continue;
        }

        throw new Error(`parseRefList: line not recognized ${line}`);
    }

    return refs;
}

/**
 * parse raw commit (`git cat-file -p`)
 */
export function parseRawCommit(sha1: string, lines: string[]): GitCommit {
    const result: GitCommitMutable = {
        type: ObjType.COMMIT,
        sha1: "",
        author: null,
        author_at: null,
        committer: null,
        commit_at: null,
        parent_sha1: [],
        message: null
    };

    for (const l of lines) {
        const tree = l.match(PATTERNS.commit.tree);
        if (tree) {
            continue;
        }

        const parent = l.match(PATTERNS.commit.parent);
        if (parent) {
            result.parent_sha1.push(parent[1]);
            continue;
        }

        const author = l.match(PATTERNS.commit.author);
        if (author) {
            result.author = parseAuthor(author[1]);
            result.author_at = parseDate(author[2]);
            continue;
        }

        const committer = l.match(PATTERNS.commit.committer);
        if (committer) {
            result.committer = parseAuthor(committer[1]);
            result.commit_at = parseDate(committer[2]);
            result.message = lines.slice(1);
            break;
        }

        throw new Error(`parseRawCommit: line not recognized ${l}`);
    }

    return result;
}