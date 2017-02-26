"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * pure functions for git-specific formats
 */
const types_1 = require("./types");
const util_1 = require("../util");
exports.ObjTypeMappings = util_1.freeze({
    commit: 1 /* COMMIT */,
    tag: 2 /* ATAG */,
    blob: 4 /* BLOB */,
    tree: 3 /* TREE */,
});
exports.PATTERNS = util_1.freeze({
    refpath: util_1.freeze({
        local_head: /^HEAD$/,
        local_branch: /^refs\/heads\/(.*)$/,
        remote_branch: /^refs\/remotes\/[^\/]+\/(?!HEAD$)/,
        remote_head: /^refs\/remotes\/[^\/]+\/HEAD$/,
        tag: /^refs\/tags\/(.*)$/,
    }),
    raw_object: util_1.freeze({
        missing: /missing$/,
        metadata: /^([a-zA-Z0-9]{40}) (\w+) (\d+)$/,
    }),
    // line printed from 'git for-each-ref'
    ref_line: /^([0-9a-zA-Z]{40})\s+(commit|tag)\s+(.*)$/i,
    reflog_line: /^([0-9a-zA-Z]{40})\s+([0-9a-zA-Z]{40})\s+(.*)\s+(\d+\s+[+-]\d+)\t(.*)$/,
    //             ^from-sha1          ^to-sha1            ^author      ^time         ^message
    date: /^(\d+)\s+([+-]\d+)$/,
    //      timestamp  timezone
    //        name    mail
    author: /^(.*)\s+<(.+@.+)>$/,
    head: util_1.freeze({
        //              dest
        refname: /^ref: (.*)$/,
    }),
    commit_sha1: /^[0-9a-zA-Z]{40}$/,
    commit: util_1.freeze({
        tree: /^tree [0-9a-zA-Z]{40}$/,
        parent: /^parent ([0-9a-zA-Z]{40})$/,
        author: /^author (.*)\s+(\d+\s+[+-]\d+)$/,
        //               ^name+mail ^timestamp+timezone
        committer: /^committer (.*)\s+(\d+\s+[+-]\d+)$/,
    }),
    atag: util_1.freeze({
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
function parseDate(dateStr) {
    const d = exports.PATTERNS.date.exec;
    const matches = exports.PATTERNS.date.exec(dateStr);
    if (!matches) {
        throw `date not recognized: ${JSON.stringify(dateStr)}`;
    }
    const timestamp = parseInt(matches[1]);
    const timezone = matches[2];
    return {
        utc_sec: timestamp,
        tz: timezone
    };
}
exports.parseDate = parseDate;
function isSHA1(line) {
    return !!line.match(exports.PATTERNS.commit_sha1);
}
exports.isSHA1 = isSHA1;
/**
 * parse line in HEAD
 *
 * @export
 * @param {string} line line like `ref: refs/heads/master` OR `(SHA1)`
 * @returns
 */
function parseHEAD(line, path = "HEAD") {
    const match1 = line.match(exports.PATTERNS.head.refname);
    if (match1) {
        // HEAD points to a branch
        return {
            type: types_1.RefType.HEAD,
            path: path,
            dest: match1[1]
        };
    }
    else if (line.match(exports.PATTERNS.commit_sha1)) {
        // 'bare' HEAD that points to a commit
        return {
            type: types_1.RefType.HEAD,
            path: path,
            dest: line
        };
    }
    throw new Error(`parseHEAD: failed to parse ${line} / ${path}`);
}
exports.parseHEAD = parseHEAD;
function parseBranch(line, path) {
    if (line.match(exports.PATTERNS.commit_sha1))
        return {
            type: types_1.RefType.BRANCH,
            path: path,
            dest: line
        };
    throw new Error(`parseBranch: failed to parse ${line} / ${path}`);
}
exports.parseBranch = parseBranch;
function parseTag(line, path) {
    if (line.match(exports.PATTERNS.commit_sha1))
        return {
            type: types_1.RefType.UNKNOWN_TAG,
            path: path,
            dest: line
        };
    throw new Error(`parseTag: failed to parse ${line} / ${path}`);
}
exports.parseTag = parseTag;
/**
 * whether dest is another ref (symbol)
 */
function isDestBranch(dest) {
    // NOTE I haven't seen a HEAD appear as dest, so only testing branch here
    for (const p of [exports.PATTERNS.refpath.local_branch, exports.PATTERNS.refpath.remote_branch]) {
        if (dest.match(p))
            return true;
    }
    return false;
}
exports.isDestBranch = isDestBranch;
/**
 * Whether the dest points to a object (*not necesarily a commit)
 */
function isRefObject(dest) {
    return !!dest.match(exports.PATTERNS.commit_sha1);
}
exports.isRefObject = isRefObject;
/**
 * parse author like "Wang Guan <momocraft@gmail.com>"
 */
function parseAuthor(str) {
    const match = exports.PATTERNS.author.exec(str);
    if (match) {
        return {
            name: match[1],
            email: match[2]
        };
    }
    else {
        return {
            name: str,
            email: ''
        };
    }
}
exports.parseAuthor = parseAuthor;
/**
 * parse one line in reflog (e.g. .git/logs/HEAD)
 */
function parseReflog(line) {
    const matches = exports.PATTERNS.reflog_line.exec(line);
    if (!matches) {
        throw `reflog not recognized: ${JSON.stringify(line)}`;
    }
    return {
        from: matches[1],
        to: matches[2],
        by: parseAuthor(matches[3]),
        at: parseDate(matches[4]),
        desc: matches[5]
    };
}
exports.parseReflog = parseReflog;
/**
 * parse output of `git for-each-ref`
 * @deprecated git for-each-ref derefs object automatically
 * FIXME remove this
 */
function parseRefList(ref_lines) {
    const refs = [];
    for (const line of ref_lines.filter(util_1.isTruthy)) {
        const matched = line.match(exports.PATTERNS.ref_line);
        const dest_sha1 = matched[1];
        const dest_type = matched[2];
        const refname = matched[3];
        if (dest_type === "commit"
            && exports.PATTERNS.refpath.remote_head.exec(refname)) {
            refs.push({ name: refname, type: types_1.RefType.HEAD, dest: dest_sha1 });
            continue;
        }
        else if (dest_type === "commit"
            && exports.PATTERNS.refpath.local_branch.exec(refname)) {
            refs.push({ name: refname, type: types_1.RefType.BRANCH, dest: dest_sha1 });
            continue;
        }
        else if (dest_type === "commit"
            && exports.PATTERNS.refpath.remote_branch.exec(refname)) {
            refs.push({ name: refname, type: types_1.RefType.BRANCH, dest: dest_sha1 });
            continue;
        }
        else if (exports.PATTERNS.refpath.tag.exec(refname)) {
            refs.push({ name: refname, type: types_1.RefType.TAG, dest: dest_sha1 });
            continue;
        }
        throw new Error(`parseRefList: line not recognized ${line}`);
    }
    return refs;
}
exports.parseRefList = parseRefList;
/**
 *
 *
 * @export
 * @param {string} lines content of $GITDIR/packed-refs
 * @returns {GitRef[]}
 */
function parsePackedRef(lines) {
    const found = [];
    for (const l of lines) {
        const matched = exports.PATTERNS.packed_ref.exec(l);
        if (matched) {
            const sha1 = matched[1];
            const refpath = matched[2];
            if (exports.PATTERNS.refpath.tag.exec(refpath)) {
                found.push({ dest: sha1, type: types_1.RefType.UNKNOWN_TAG, path: refpath });
            }
            else if (exports.PATTERNS.refpath.local_branch.exec(refpath)) {
                found.push({ dest: sha1, type: types_1.RefType.BRANCH, path: refpath });
            }
            else if (exports.PATTERNS.refpath.remote_branch.exec(refpath)) {
                found.push({ dest: sha1, type: types_1.RefType.BRANCH, path: refpath });
            }
            else {
                throw new Error(`parsePackedRef: refpath not recognized - ${refpath}`);
            }
        } // else ignore
    }
    return found;
}
exports.parsePackedRef = parsePackedRef;
/**
 * parse raw commit (`git cat-file -p`, or lines 1+ of `git cat-file --batch`)
 */
function parseCommit(sha1, lines) {
    const origLines = lines;
    lines = lines.slice();
    const result = {
        type: 1 /* COMMIT */,
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
        const tree = l.match(exports.PATTERNS.commit.tree);
        if (tree) {
            continue;
        }
        const parent = l.match(exports.PATTERNS.commit.parent);
        if (parent) {
            result.parent_sha1.push(parent[1]);
            continue;
        }
        const author = l.match(exports.PATTERNS.commit.author);
        if (author) {
            result.author = parseAuthor(author[1]);
            result.author_at = parseDate(author[2]);
            continue;
        }
        const committer = l.match(exports.PATTERNS.commit.committer);
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
exports.parseCommit = parseCommit;
function parseAnnotatedTag(sha1, lines) {
    let dest, destType, tagger, tagged_at, name, message;
    const match_dest = exports.PATTERNS.atag.dest.exec(lines[0]);
    dest = match_dest[1];
    const match_type = exports.PATTERNS.atag.type.exec(lines[1]);
    destType = exports.ObjTypeMappings[match_type[1]];
    const match_name = exports.PATTERNS.atag.tag.exec(lines[2]);
    name = match_name[1];
    const match_tagger = exports.PATTERNS.atag.tagger.exec(lines[3]);
    tagger = parseAuthor(match_tagger[1]);
    tagged_at = parseDate(match_tagger[2]);
    message = lines.slice(5);
    if (![match_dest, match_type, match_name, match_tagger,
        dest, destType, tagged_at, name].every(v => !!v))
        throw new Error(`parseAnnotatedTag: cannot recognize ${JSON.stringify(lines)}`);
    return {
        sha1: sha1,
        type: 2 /* ATAG */,
        dest: dest,
        destType: destType,
        tagger: tagger,
        tagged_at: tagged_at,
        name: name,
        message: message
    };
}
exports.parseAnnotatedTag = parseAnnotatedTag;
//# sourceMappingURL=parser.js.map