/**
 * Types of git objects
 *
 * (They are "raw": reference will not be resolved)
 *
 * @copyright Wang Guan
 */
type SHA1 = string

export enum ObjType {
    COMMIT = <any>"Commit",
    ATAG = <any>"Annotated tag",
    TREE = <any>"Tree",
    BLOB = <any>"Blob",
}

export interface GitObject {
    type: ObjType
    sha1: SHA1
}

export enum RefType {
    TAG = <any>"Tag",
    BRANCH = <any>"Branch",
    HEAD = <any>"HEAD",
}

export interface GitCommit extends GitObject {
    readonly author: GitHuman
    readonly author_at: GitTimestamp
    readonly committer: GitHuman
    readonly commit_at: GitTimestamp
    readonly parent_sha1: SHA1[],
    readonly message: string[]
}

export interface MutableGitCommit extends GitCommit {
    author: GitHuman
    author_at: GitTimestamp
    committer: GitHuman
    commit_at: GitTimestamp
    parent_sha1: SHA1[],
    message: string[]
}

/**
 * A reference can be HEAD / Branch / Tag
 */
export interface GitRef {
    readonly type: RefType
    /**
     * local HEAD:          HEAD
     * local branch:        refs/heads/<branch>
     * remote HEAD:         refs/remotes/<remote>/HEAD
     * remote branch        refs/remotes/<remote>/<branch>
     * tag                  refs/tags/<tag>
     */
    readonly name: string
}

/**
 * GitTag: a plain tag
 */
export class GitTag implements GitRef {
    readonly type = RefType.TAG
    readonly name: string

    /**
     * NOTE "dest" can actually be ANY git object, not limited to commit.
     * This holds for even plain (non-annotated) tag
     */
    readonly dest: SHA1

    constructor(name: string, dest: SHA1) {
        this.name = name;
        this.dest = dest;
    }
}

/**
 * Annotated tag (`git tag -a`)
 * NOTE "dest" field of a annotated tag is actually an object for the object itself
 */
export class GitAnnotatedTag extends GitTag {
    /**
     * annotation: only exists in annotated tag
     */
    readonly annotation?: GitTagAnnotation
    constructor(name: string, dest: SHA1, annotation: GitTagAnnotation) {
        super(name, dest);
        this.annotation = annotation;
    }
}

/**
 * GitTagAnnotation: only exists in *annotated* tag
 */
interface GitTagAnnotation {
    readonly by: GitHuman,
    readonly message: string[],
    readonly at: GitTimestamp
}

/**
 * 'Branch' ref: points to a commit
 */
export class GitBranch implements GitRef {
    readonly type = RefType.BRANCH
    readonly name: string
    // type: commit
    readonly dest: SHA1
    constructor(dest: SHA1) {
        this.dest = dest
    }
}

/**
 * HEAD that points to a branch
 */
export class GitHead implements GitRef {
    readonly type = RefType.HEAD
    readonly name: string

    /**
     * dest: a commit or a branch
     */
    readonly dest: string
    constructor(name: string, dest_name: string) {
        this.name = name;
        this.dest = dest_name;
    }
}

/**
 * 'Bare' head: points to a commit instead of branch
 */
export class GitBareHead implements GitRef {
    readonly type = RefType.HEAD
    readonly name: string
    /**
     * dest_commit: sha1 for commit
     */
    readonly dest_commit: SHA1
    constructor(name: string, dest_commit: SHA1) {
        this.name = name;
        this.dest_commit = dest_commit;
    }
}

/**
 * A 'human' in git: author +
 */
export interface GitHuman {
    readonly name: string
    readonly email: string
}

/**
 * An item in reflog
 */
export interface GitRefLog {
    readonly from: SHA1
    readonly to: SHA1
    readonly by: GitHuman
    readonly at: GitTimestamp
    readonly desc: string
}

/**
 * Storing timezone separately
 * Bacause JS's "Date" type does not have meaningful timezone support
 *
 * UI may choose to format with moment.js
 */
export interface GitTimestamp {
    readonly utc_sec: number
    readonly tz: string
}
