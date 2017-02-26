/**
 * pure functions for git-specific formats
 */
import {
    RefType, GitRef,
    ObjType, GitObject,
    GitCommit, GitCommitMutable,
    GitRefLog, GitHuman, GitTimestamp,
    GitATag, GitATagMutable,
} from './types';
import { isTruthy, deepFreeze, freeze, ArrayM } from '../util';


export const ObjTypeMappings = freeze({
    commit: ObjType.COMMIT,
    tag: ObjType.ATAG,
    blob: ObjType.BLOB,
    tree: ObjType.TREE,
} as { [type: string]: ObjType })

export const PATTERNS = freeze({
    refpath: freeze({
        local_head: /^HEAD$/,
        local_branch: /^refs\/heads\/(.*)$/,
        remote_branch: /^refs\/remotes\/[^\/]+\/(?!HEAD$)/,
        remote_head: /^refs\/remotes\/[^\/]+\/HEAD$/,
        tag: /^refs\/tags\/(.*)$/,
        // all: /(head|\/)/i,
    }),

    raw_object: freeze({
        missing: /missing$/,
        metadata: /^([a-zA-Z0-9]{40}) (\w+) (\d+)$/,
        //         ^sha1              type   size
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

    commit: freeze({
        tree: /^tree [0-9a-zA-Z]{40}$/,
        parent: /^parent ([0-9a-zA-Z]{40})$/,
        author: /^author (.*)\s+(\d+\s+[+-]\d+)$/,
        //               ^name+mail ^timestamp+timezone
        committer: /^committer (.*)\s+(\d+\s+[+-]\d+)$/,
    }),

    atag: freeze({
        dest: /^object ([0-9a-zA-Z]{40})$/,
        type: /^type (.*)$/,
        tag: /^tag (.*)$/,
        tagger: /^tagger (.*)\s+(\d+\s+[+-]\d+)$/,
    }),

    // $1: sha1 $2: refpath
    packed_ref: /^([0-9a-zA-Z]{40}) (.*)$/,
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

export function isSHA1(line: string) {
    return !!line.match(PATTERNS.commit_sha1);
}

/**
 * parse line in HEAD
 * 
 * @export
 * @param {string} line line like `ref: refs/heads/master` OR `(SHA1)`
 * @returns
 */
export function parseHEAD(line: string, path = "HEAD"): GitRef {
    const match1 = line.match(PATTERNS.head.refname);
    if (match1) {
        // HEAD points to a branch
        return {
            type: RefType.HEAD,
            path: path,
            dest: match1[1]
        }
    } else if (line.match(PATTERNS.commit_sha1)) {
        // 'bare' HEAD that points to a commit
        return {
            type: RefType.HEAD,
            path: path,
            dest: line
        }
    }
    throw new Error(`parseHEAD: failed to parse ${line} / ${path}`);
}

export function parseBranch(line: string, path: string): GitRef {
    if (line.match(PATTERNS.commit_sha1))
        return {
            type: RefType.BRANCH,
            path: path,
            dest: line
        };
    throw new Error(`parseBranch: failed to parse ${line} / ${path}`);
}

export function parseTag(line: string, path: string): GitRef {
    if (line.match(PATTERNS.commit_sha1))
        return {
            type: RefType.UNKNOWN_TAG,
            path: path,
            dest: line
        };
    throw new Error(`parseTag: failed to parse ${line} / ${path}`);
}

/**
 * whether dest is another ref (symbol)
 */
export function isDestBranch(dest: string): boolean {
    // NOTE I haven't seen a HEAD appear as dest, so only testing branch here
    for (const p of [PATTERNS.refpath.local_branch, PATTERNS.refpath.remote_branch]) {
        if (dest.match(p))
            return true;
    }
    return false;
}

/**
 * Whether the dest points to a object (*not necesarily a commit)
 */
export function isRefObject(dest: string): boolean {
    return !!dest.match(PATTERNS.commit_sha1);
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
 * @deprecated git for-each-ref derefs object automatically
 * FIXME remove this
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
 * 
 * 
 * @export
 * @param {string} lines content of $GITDIR/packed-refs
 * @returns {GitRef[]}
 */
export function parsePackedRef(lines: string[]): GitRef[] {
    const found = [] as GitRef[];
    for (const l of lines) {
        const matched = PATTERNS.packed_ref.exec(l);
        if (matched) {
            const sha1 = matched[1];
            const refpath = matched[2];

            if (PATTERNS.refpath.tag.exec(refpath)) {
                found.push({ dest: sha1, type: RefType.UNKNOWN_TAG, path: refpath });
            } else if (PATTERNS.refpath.local_branch.exec(refpath)) {
                found.push({ dest: sha1, type: RefType.BRANCH, path: refpath });
            } else if (PATTERNS.refpath.remote_branch.exec(refpath)) {
                found.push({ dest: sha1, type: RefType.BRANCH, path: refpath });
            } else {
                throw new Error(`parsePackedRef: refpath not recognized - ${refpath}`);
            }
        } // else ignore
    }

    return found;
}

/**
 * parse raw commit (`git cat-file -p`, or lines 1+ of `git cat-file --batch`)
 */
export function parseCommit(sha1: string, lines: string[]): GitCommit {
    const origLines = lines;
    lines = lines.slice();
    const result: GitCommitMutable = {
        type: ObjType.COMMIT,
        sha1: sha1,
        author: null,
        author_at: null,
        committer: null,
        commit_at: null,
        parent_sha1: [],
        message: null,
    };

    while (lines.length) {
        const l = lines.shift();
        if (!l)
            continue;
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

        throw new Error(`parseRawCommit(${sha1}): line not recognized ${l} in ${JSON.stringify(origLines)}`);
    }

    return result;
}

export function parseAnnotatedTag(sha1: string, lines: string[]): GitATag {
    let dest: string,
        destType: ObjType,
        tagger: GitHuman,
        tagged_at: GitTimestamp,
        name: string,
        message: string[];

    const match_dest = PATTERNS.atag.dest.exec(lines[0]);
    dest = match_dest[1];

    const match_type = PATTERNS.atag.type.exec(lines[1]);
    destType = ObjTypeMappings[match_type[1]];

    const match_name = PATTERNS.atag.tag.exec(lines[2]);
    name = match_name[1];

    const match_tagger = PATTERNS.atag.tagger.exec(lines[3]);
    tagger = parseAuthor(match_tagger[1]);
    tagged_at = parseDate(match_tagger[2]);

    message = lines.slice(5);

    if (![match_dest, match_type, match_name, match_tagger,
        dest, destType, tagged_at, name].every(v => !!v))
        throw new Error(`parseAnnotatedTag: cannot recognize ${JSON.stringify(lines)}`);

    return {
        sha1: sha1,
        type: ObjType.ATAG,
        dest: dest,
        destType: destType,
        tagger: tagger,
        tagged_at: tagged_at,
        name: name,
        message: message
    }
}