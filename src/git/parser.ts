/**
 * pure functions for git-specific formats
 */
import { Human, Obj, Ref, RefLog, Timestamp } from './types';
import { freeze } from '../vendor/ts-commonutil/type';

export const ObjTypeMappings = freeze({
  commit: Obj.ObjType.Commit,
  tag: Obj.ObjType.ATag,
  blob: Obj.ObjType.Blob,
  tree: Obj.ObjType.Tree,
});

export const PATTERNS = freeze({
  refpath: freeze({
    localHead: /^HEAD$/,
    localBranch: /^refs\/heads\/(.*)$/,
    remoteBranch: /^refs\/remotes\/[^\/]+\/(?!HEAD$)/,
    remoteHead: /^refs\/remotes\/[^\/]+\/HEAD$/,
    tag: /^refs\/tags\/(.*)$/,
    stash: /^refs\/stash$/,
    // all: /(head|\/)/i,
  }),

  rawObject: freeze({
    missing: /missing$/,
    metadata: /^([a-zA-Z0-9]{40}) (\w+) (\d+)$/,
    //         ^sha1              type   size
  }),

  // line printed from 'git for-each-ref'
  refLine: /^([0-9a-zA-Z]{40})\s+(commit|tag)\s+(.*)$/i,

  reflogLine: /^([0-9a-zA-Z]{40})\s+([0-9a-zA-Z]{40})\s+(.*)\s+(\d+\s+[+-]\d+)\t(.*)$/,
  //             ^from-sha1          ^to-sha1            ^author      ^time         ^message

  date: /^(\d+)\s+([+-]\d+)$/,
  //      timestamp  timezone

  //        name    mail
  author: /^(.*)\s+<(.+@.+)>$/,

  head: freeze({
    //              dest
    refname: /^ref: (.*)$/,
  }),

  objectSha1: /^[0-9a-zA-Z]{40}$/,

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
  packedRef: /^([0-9a-zA-Z]{40}) (.*)$/,
});

/**
 * parse date like '1480181019 +0500'
 */
export function parseDate(dateStr: string): Timestamp {
  const matches = PATTERNS.date.exec(dateStr);

  if (!matches) {
    throw `date not recognized: ${JSON.stringify(dateStr)}`;
  }

  const timestamp = parseInt(matches[1]);
  const timezone = matches[2];
  return {
    utcSec: timestamp,
    tz: timezone,
  };
}

export function isSHA1(line: string) {
  return !!line.match(PATTERNS.objectSha1);
}

/**
 * parse line in HEAD
 *
 * @export
 * @param {string} line line in the "HEAD" file: like `ref: refs/heads/master` OR `(SHA1)`
 * @param path
 * @returns
 */
export function parseHEAD(line: string, path = 'HEAD'): Ref.LocalHead {
  const match1 = line.match(PATTERNS.head.refname);
  if (match1) {
    // HEAD points to a branch
    return {
      path,
      type: Ref.RefType.LocalHead,
      dest: match1[1],
    };
  }

  if (line.match(PATTERNS.objectSha1)) {
    // 'bare' HEAD that points to a commit
    return {
      path,
      type: Ref.RefType.LocalHead,
      dest: line,
    };
  }
  throw new Error(`parseHEAD: failed to parse ${line} / ${path}`);
}

export function parseBranch(line: string, path: string): Ref.LocalBranch {
  if (line.match(PATTERNS.objectSha1)) {
    return {
      path,
      type: Ref.RefType.LocalBranch,
      dest: line,
    };
  }
  throw new Error(`parseBranch: failed to parse ${line} / ${path}`);
}

export function parseTag(line: string, path: string): Ref.Tag {
  if (line.match(PATTERNS.objectSha1)) {
    return {
      path,
      type: Ref.RefType.Tag,
      dest: line,
    };
  }
  throw new Error(`parseTag: failed to parse ${line} / ${path}`);
}

/**
 * whether dest is another ref (symbol)
 */
export function isDestBranch(dest: string): boolean {
  // NOTE I haven't seen a HEAD appear as dest, so only testing branch here
  for (const p of [PATTERNS.refpath.localBranch, PATTERNS.refpath.remoteBranch]) {
    if (dest.match(p)) {
      return true;
    }
  }
  return false;
}

/**
 * Whether the dest points to a object (*not necessarily a commit)
 */
export function isObject(dest: string): boolean {
  return !!dest.match(PATTERNS.objectSha1);
}

/**
 * parse author like "Wang Guan <momocraft@gmail.com>"
 */
export function parseAuthor(str: string): Human {
  const match = PATTERNS.author.exec(str);
  if (match) {
    return {
      name: match[1],
      email: match[2],
    };
  } else {
    return {
      name: str,
      email: '',
    };
  }
}

/**
 * parse one line in reflog (e.g. .git/logs/HEAD)
 */
export function parseReflog(line: string): RefLog {
  const matches = PATTERNS.reflogLine.exec(line);

  if (!matches) {
    throw `reflog not recognized: ${JSON.stringify(line)}`;
  }

  return {
    from: matches[1],
    to: matches[2],
    by: parseAuthor(matches[3]),
    at: parseDate(matches[4]),
    desc: matches[5],
  };
}

export function parsePackedRefBlock(lines: string[]): Ref.Ref[] {
  return lines
    .filter(line => line && !line.startsWith('#') && !line.startsWith('^')) // drop lines like '# pack-refs with: peeled fully-peeled'
    .map(parsePackedRef);
}

/**
 * @param {string} line one line in $GITDIR/packed-refs
 * @returns {GitRef}
 */
export function parsePackedRef(line: string): Ref.Ref {
  const l = line;
  const matched = PATTERNS.packedRef.exec(l);

  if (matched) {
    const sha1 = matched[1];
    const refPath = matched[2];

    if (PATTERNS.refpath.tag.test(refPath)) {
      return { dest: sha1, type: Ref.RefType.Tag, path: refPath };
    }
    if (PATTERNS.refpath.localBranch.test(refPath)) {
      return { dest: sha1, type: Ref.RefType.LocalBranch, path: refPath };
    }
    if (PATTERNS.refpath.remoteBranch.test(refPath)) {
      return { dest: sha1, type: Ref.RefType.RemoteBranch, path: refPath };
    }
    if (PATTERNS.refpath.stash.test(refPath)) {
      return { dest: sha1, type: Ref.RefType.Stash, path: refPath };
    }
  }

  throw new Error(`parsePackedRef: refpath not recognized - ${l}`);
}

/**
 * parse raw commit (`git cat-file -p`, or lines 1+ of `git cat-file --batch`)
 */
export function parseCommit(sha1: string, origLines: string[]): Obj.Commit {
  const lines = origLines.slice();
  const result: Obj.CommitMutable = {
    sha1,
    type: Obj.ObjType.Commit,
    author: null!,
    authorAt: null!,
    committer: null!,
    commitAt: null!,
    parentSHA1: [],
    message: null!,
  };

  while (lines.length) {
    const l = lines.shift();
    if (!l) {
      continue;
    }
    const tree = l.match(PATTERNS.commit.tree);
    if (tree) {
      continue;
    }

    const parent = l.match(PATTERNS.commit.parent);
    if (parent) {
      result.parentSHA1.push(parent[1]);
      continue;
    }

    const author = l.match(PATTERNS.commit.author);
    if (author) {
      result.author = parseAuthor(author[1]);
      result.authorAt = parseDate(author[2]);
      continue;
    }

    const committer = l.match(PATTERNS.commit.committer);
    if (committer) {
      result.committer = parseAuthor(committer[1]);
      result.commitAt = parseDate(committer[2]);
      result.message = lines.slice(1);
      break;
    }

    throw new Error(`parseRawCommit(${sha1}): line not recognized ${l} in ${JSON.stringify(origLines)}`);
  }

  return result;
}

export function parseAnnotatedTag(sha1: string, lines: string[]): Obj.ATag {
  let dest: string, destType: Obj.ObjType, tagger: Human, taggedAt: Timestamp, name: string, message: string[];

  const matchDest = PATTERNS.atag.dest.exec(lines[0])!;
  dest = matchDest[1];

  const matchType = PATTERNS.atag.type.exec(lines[1])!;
  destType = ObjTypeMappings[matchType[1] as keyof typeof ObjTypeMappings];

  const matchName = PATTERNS.atag.tag.exec(lines[2])!;
  name = matchName[1];

  const matchTagger = PATTERNS.atag.tagger.exec(lines[3])!;
  tagger = parseAuthor(matchTagger[1]);
  taggedAt = parseDate(matchTagger[2]);

  message = lines.slice(5);

  if (![matchDest, matchType, matchName, matchTagger, dest, destType, taggedAt, name].every(v => !!v)) {
    throw new Error(`parseAnnotatedTag: cannot recognize ${JSON.stringify(lines)}`);
  }

  return {
    sha1,
    dest,
    destType,
    tagger,
    taggedAt,
    name,
    message,
    type: Obj.ObjType.ATag,
  };
}
