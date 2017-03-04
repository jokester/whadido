/**
 * "raw" types that map to git protocol
 *
 * @copyright Wang Guan
 */
import { DeepReadonly, freeze } from '../util';

/**
 * SHA1: 160bits / 40chars
 */
type SHA1 = string

export const enum ObjType {
    COMMIT = 1,
    ATAG,
    TREE,
    BLOB,
}

/**
 * "Object": anything that have a SHA1 hash
 */
export interface ObjectMutable {
    type: ObjType
    sha1: SHA1
}

export type GitObject = Readonly<ObjectMutable>

/**
 * Object with raw data loaded
 */
export type GitObjectData = Readonly<ObjectMutable & { data: Buffer }>


export const DetectObjType = freeze({
    isCommit(obj: GitObject): obj is GitCommit {
        return obj.type === ObjType.COMMIT;
    },
    isAnnotatedTag(obj: GitObject): obj is GitATag {
        return obj.type === ObjType.ATAG;
    }
});

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

export interface GitATagMutable extends ObjectMutable {
    dest: SHA1
    destType: ObjType
    tagger: GitHuman
    tagged_at: GitTimestamp
    name: string
    message: string[]
}

export type GitATag = Readonly<GitATagMutable>

export type GitShallowTag = {

}

/**
 * "path" of a git reference
 * 
 * NOTE: references can be stored without pack (.git/refs, .git/HEAD)
 * or packed (.git/packed-refs), a reader should look at all these places.
 * 
 * local HEAD:          HEAD
 * local branch:        refs/heads/<branch>
 * remote HEAD:         refs/remotes/<remote>/HEAD
 * remote branch        refs/remotes/<remote>/<branch>
 * tag                  refs/tags/<tag>
 */
type RefPath = string;

/**
 * "Ref": git value that points to something else
 * NOTE: ref itself may or may not be a git object
 */
export enum RefType {
    // tags that are not resolved. A tag may point to a commit (normal) or any object
    UNKNOWN_TAG = <any>"TAG OF UNKNOWN KIND",
    ATAG = <any>"Annotated Tag",
    TAG = <any>"Shallow Tag",
    BRANCH = <any>"Branch",
    HEAD = <any>"HEAD",
}

/**
 * A reference can be HEAD / Branch / Tag / Annotated tag
 */
export interface GitRef {
    readonly path: RefPath

    /**
     * NOTE: Annotated / Shallow tag cannot be deduced until the dest object is read
     */
    readonly type: RefType

    /**
     * NOTE sha1 may not necessaryily be a commit, even for plain tag
     *
     * HEAD > dest=branch (RefPath)
     * HEAD > dest=commit (SHA1)
     * branch > dest=commit (SHA1)
     * ShallowTag > dest=object (SHA1) (>real dest)
     * dest=AnnoatedTag > object (SHA1)
     */
    readonly dest: SHA1 | RefPath
}

export interface GitHeadRef extends GitRef {
    destBranch?: GitBranchRef;
    destCommit?: SHA1;
}

export interface GitBranchRef extends GitRef {
    destCommit: SHA1
}

export interface GitTagRef extends GitRef {
    destObj: SHA1
}

export interface GitAtagRef extends GitRef {
    destObj: SHA1
    destType: ObjType
    annotation: GitTagAnnotation
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

/**
 * GitTagAnnotation: only exists in *annotated* tag
 */
export interface GitTagAnnotation {
    readonly sha1: SHA1
    readonly by: GitHuman
    readonly message: string[]
    readonly at: GitTimestamp
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