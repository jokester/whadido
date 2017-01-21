"use strict";
/**
 * (pure & sync) parsers for git raw format
 */
const git_types_1 = require("./git-types");
const util_1 = require("../util");
exports.PATTERNS = {
    refnames: {
        local_head: /^HEAD$/,
        local_branch: /^refs\/heads\//,
        remote_branch: /^refs\/remotes\/[^\/]+\/(?!HEAD$)/,
        remote_head: /^refs\/remotes\/[^\/]+\/HEAD$/,
        tag: /^refs\/tags\//,
    },
    // line printed from 'git for-each-ref'
    ref_line: /^([0-9a-zA-Z]{40})\s+(commit|tag)\s+(.*)$/i,
    reflog_line: /^([0-9a-zA-Z]{40})\s+([0-9a-zA-Z]{40})\s+(.*)\s+(\d+\s+[+-]\d+)\t(.*)$/,
    //             ^from-sha1          ^to-sha1            ^author      ^time         ^message
    date: /^(\d+)\s+([+-]\d+)$/,
    //      timestamp  timezone
    //        name    mail
    author: /^(.*)\s+<(.+@.+)>$/,
    head: {
        //              dest
        refname: /^ref: (.*)$/,
    },
    commit_sha1: /^[0-9a-zA-Z]{40}$/,
    commit: {
        tree: /^tree [0-9a-zA-Z]{40}$/,
        parent: /^parent ([0-9a-zA-Z]{40})$/,
        author: /^author (.*)\s+(\d+\s+[+-]\d+)$/,
        committer: /^committer (.*)\s+(\d+\s+[+-]\d+)$/,
    }
};
/**
 * parse date like '1480181019 +0500'
 */
function parseDate(dateStr) {
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
function isCommitSHA1(line) {
    return !!line.match(exports.PATTERNS.commit_sha1);
}
exports.isCommitSHA1 = isCommitSHA1;
/**
 * extract refname from content of HEAD
 */
function extractRef(line) {
    const match = line.match(exports.PATTERNS.head.refname);
    if (!match)
        throw new Error(`extractRef: ref not found in ${line}`);
    return match[1];
}
exports.extractRef = extractRef;
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
 */
function parseRefList(ref_lines) {
    const refs = [];
    for (const line of ref_lines.filter(util_1.isTruthy)) {
        const matched = line.match(exports.PATTERNS.ref_line);
        const dest_sha1 = matched[1];
        const dest_type = matched[2];
        const refname = matched[3];
        if (dest_type === "commit"
            && exports.PATTERNS.refnames.remote_head.exec(refname)) {
            refs.push({ name: refname, type: git_types_1.RefType.HEAD, dest: dest_sha1 });
            continue;
        }
        else if (dest_type === "commit"
            && exports.PATTERNS.refnames.local_branch.exec(refname)) {
            refs.push({ name: refname, type: git_types_1.RefType.BRANCH, dest: dest_sha1 });
            continue;
        }
        else if (dest_type === "commit"
            && exports.PATTERNS.refnames.remote_branch.exec(refname)) {
            refs.push({ name: refname, type: git_types_1.RefType.BRANCH, dest: dest_sha1 });
            continue;
        }
        else if (exports.PATTERNS.refnames.tag.exec(refname)) {
            refs.push({ name: refname, type: git_types_1.RefType.TAG, dest: dest_sha1 });
            continue;
        }
        throw new Error(`parseRefList: line not recognized ${line}`);
    }
    return refs;
}
exports.parseRefList = parseRefList;
/**
 * parse raw commit (`git cat-file -p`)
 */
function parseRawCommit(sha1, lines) {
    lines = lines.slice();
    const result = {
        type: git_types_1.ObjType.COMMIT,
        sha1,
        author: null,
        author_at: null,
        committer: null,
        commit_at: null,
        parent_sha1: [],
        message: null
    };
    while (lines.length) {
        const l = lines.shift();
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
        throw new Error(`parseRawCommit: line not recognized ${l}`);
    }
    return result;
}
exports.parseRawCommit = parseRawCommit;
//# sourceMappingURL=parser.js.map