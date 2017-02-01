/**
 * "raw" types that map to format of repository (which means references are not resolved)
 *
 * @copyright Wang Guan
 */
import { DeepReadonly } from '../util';

/**
 * SHA1: 160bits / 40chars
 */
type SHA1 = string

interface ObjectMutable {
    type: ObjType
    sha1: SHA1
}

/**
 * "Object": anything that have a SHA1 hash
 */
export type GitObject = Readonly<ObjectMutable>

/**
 * Object with raw data loaded
 */
export type GitObjectData = Readonly<ObjectMutable & { data: Buffer }>

export enum ObjType {
    COMMIT = <any>"Commit",
    ATAG = <any>"Annotated tag",
    TREE = <any>"Tree",
    BLOB = <any>"Blob",
}

/**
 * Commit is what we stop resolving ref(s) at
 */
export interface GitCommitMutable extends ObjectMutable {
    author: GitHuman
    author_at: GitTimestamp
    committer: GitHuman
    commit_at: GitTimestamp
    parent_sha1: SHA1[]
    message: string[]
}

export type GitCommit = DeepReadonly<GitCommitMutable>

/**
 * "path" to 
 * 
 * NOTE references can be stored without pack (.git/refs, .git/HEAD)
 * or packed (.git/packed-refs)
 * 
 * local HEAD:          HEAD
 * local branch:        refs/heads/<branch>
 * remote HEAD:         refs/remotes/<remote>/HEAD
 * remote branch        refs/remotes/<remote>/<branch>
 * tag                  refs/tags/<tag>
 */
type RefPath = string;

/**
 * "Ref": points to another
 * NOTE (GitRef & Obje)
 */
export enum RefType {
    // tags that are not resolved. A tag may point to a commit (normal for )
    UNKNOWN_TAG = <any>"TAG OF UNKNOWN KIND",
    ATAG = <any>"Annotated tag",
    TAG = <any>"Tag",
    BRANCH = <any>"Branch",
    HEAD = <any>"HEAD",
}

/**
 * A reference can be HEAD / Branch / Tag / Annotated tag
 */
export interface GitRef {
    readonly type: RefType
    readonly path: RefPath
    /**
     * SHA1 when it 
     * NOTE sha1 may not necessaryily be a commit, even for plain tag
     */
    readonly dest: SHA1 | RefPath
}

/**
 * A 'human' in git: author + email
 */
export interface GitHuman {
    readonly name: string
    readonly email: string
}

/**
 * An item in reflog
 *
 * (reflog only exists for 'mutable' ref, i.e. branch / HEAD)
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

module Unused {

    // /**
    //  * GitTag: a plain (non-annotated) tag
    //  *
    //  * NOTE technically a plain tag can point to a non-commit object
    //  */
    // export interface GitTag<T extends GitRef<any> | GitObject> extends GitRef<T> {
    //     readonly type: RefType
    //     readonly name: string

    //     /**
    //      * NOTE "dest" can actually be ANY git object, not limited to commit.
    //      * This holds for even plain (non-annotated) tag
    //      */
    //     readonly dest: T;
    // }

    // /**
    //  * Annotated tag (`git tag -a`)
    //  * NOTE "dest" field of a annotated tag is actually an object for the object itself
    //  */
    // export class GitAnnotatedTag extends GitTag {
    //     /**
    //      * annotation: only exists in annotated tag
    //      */
    //     readonly annotation?: GitTagAnnotation
    //     constructor(name: string, dest: SHA1, annotation: GitTagAnnotation) {
    //         super(name, dest);
    //         this.annotation = annotation;
    //     }
    // }

    // /**
    //  * GitTagAnnotation: only exists in *annotated* tag
    //  */
    // interface GitTagAnnotation {
    //     readonly by: GitHuman,
    //     readonly message: string[],
    //     readonly at: GitTimestamp
    // }

    // /**
    //  * 'Branch' ref: points to a commit
    //  */
    // export class GitBranch implements GitRef {
    //     readonly type = RefType.BRANCH
    //     readonly name: string
    //     // type: commit
    //     readonly dest: SHA1
    //     constructor(dest: SHA1) {
    //         this.dest = dest
    //     }
    // }

    // /**
    //  * HEAD that points to a branch
    //  */
    // export interface GitHead implements GitRef {
    //     readonly type = RefType.HEAD
    //     readonly name: string

    //     /**
    //      * dest: a commit or a branch
    //      */
    //     readonly dest: string
    // constructor(name: string, dest_name: string) {
    //     this.name = name;
    //     this.dest = dest_name;
    // }
    // }

    // /**
    //  * 'Bare' head: points to a commit instead of branch
    //  */
    // export class GitBareHead implements GitRef {
    //     readonly type = RefType.HEAD
    //     readonly name: string
    //     /**
    //      * dest_commit: sha1 for commit
    //      */
    //     readonly dest_commit: SHA1
    //     constructor(name: string, dest_commit: SHA1) {
    //         this.name = name;
    //         this.dest_commit = dest_commit;
    //     }
    // }


}