/**
 * "raw" types that map to git protocol
 *
 * @copyright Wang Guan
 */
/**
 * SHA1: 160bits / 40chars
 */
import { DeepReadonly } from '../vendor/ts-commonutil/type';

type SHA1 = string;

/**
 * "Object": anything that have a SHA1 hash
 */
export namespace Obj {
  export const enum ObjType {
    Commit = 'ObjType.Commit',
    ATag = 'ObjType.AnnotatedTag',
    Tree = 'ObjType.Tree',
    Blob = 'ObjType.Blob',
  }

  interface ObjectMutable {
    type: ObjType;
    sha1: SHA1;
  }

  export type Object = Readonly<ObjectMutable>;

  /**
   * Object with raw data loaded
   */
  export type ObjectData = Readonly<ObjectMutable & { data: Buffer }>;

  export interface CommitMutable extends ObjectMutable {
    author: Human;
    authorAt: Timestamp;
    committer: Human;
    commitAt: Timestamp;
    parentSHA1: SHA1[];
    message: string[];
  }

  export type Commit = DeepReadonly<CommitMutable>;

  interface ATagMutable extends ObjectMutable {
    dest: SHA1;
    destType: ObjType;
    tagger: Human;
    taggedAt: Timestamp;
    name: string;
    message: string[];
  }

  export type ATag = Readonly<ATagMutable>;

  export function isCommit(obj: { type: unknown }): obj is Commit {
    return obj.type === ObjType.Commit;
  }

  export function isAnnotatedTag(obj: { type: unknown }): obj is ATag {
    return obj.type === ObjType.ATag;
  }

  // should not need to read tree/blob
}

export namespace Ref {
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
  export const enum RefType {
    // Unknown = "Unknown",            // unknown
    // ATag = "Annotated Tag",         // points to an object (the annotation itself)
    Tag = 'RefType.Tag', // points to an object
    LocalBranch = 'RefType.LocalBranch', // points to a commit
    LocalHead = 'RefType.LocalHEAD', // points to (commit or branch)
    RemoteBranch = 'RefType.RemoteBranch', // points to commit
    RemoteHead = 'RefType.RemoteHEAD', // points to (commit or branch)
    Stash = 'RefType.Stash',
  }

  export function isRefType(val: unknown): val is RefType {
    switch (val) {
      case RefType.Tag:
      case RefType.LocalBranch:
      case RefType.LocalHead:
      case RefType.RemoteBranch:
      case RefType.RemoteHead:
        return true;
      default:
        return false;
    }
  }

  export function isBranchRef(val: { type: unknown }): val is LocalBranch | RemoteBranch {
    return val.type === RefType.RemoteBranch || val.type === RefType.LocalBranch;
  }

  export function isLocalBranch(val: { type: unknown }): val is LocalBranch {
    return val.type === RefType.LocalBranch;
  }

  export function isRemoteBranch(val: { type: unknown }): val is RemoteBranch {
    return val.type === RefType.RemoteBranch;
  }

  /**
   * A reference that may be resolved in future. Can be HEAD / Branch / Tag / Annotated tag
   */
  interface RefBase {
    readonly path: RefPath;

    /**
     * NOTE: Annotated / Shallow tag cannot be deduced until the dest object is read
     */
    readonly type: RefType;

    /**
     * NOTE sha1 may not necessarily be a commit, even for a plain tag
     *
     * We should ignore references that resolves to a non-commit object
     *
     * valid cases to consider:
     * HEAD > dest=branch (RefPath)
     * HEAD > dest=commit (SHA1)
     * branch > dest=commit (SHA1)
     * ShallowTag > dest=commit (SHA1)
     * AnnoatedTag > dest1=Annotation > dest2=commit (SHA1)
     */
    readonly dest: SHA1 | RefPath;
  }

  /** To make things clearer, should try to resolve all refs upon read **/
  export type Ref = LocalHead | LocalBranch | RemoteHead | RemoteBranch | Tag | Stash;

  export interface LocalHead extends RefBase {
    readonly type: RefType.LocalHead;
  }

  export interface LocalBranch extends RefBase {
    readonly type: RefType.LocalBranch;
  }

  export interface Tag extends RefBase {
    readonly type: RefType.Tag;
  }

  export interface Stash extends RefBase {
    readonly type: RefType.Stash;
  }

  //
  // export interface ATag extends RefBase {
  //   readonly type: RefType.ATag;
  //   readonly destObj: SHA1;
  //   readonly annotation: Annotation;
  // }

  export interface RemoteHead extends RefBase {
    readonly type: RefType.RemoteBranch;
  }

  export interface RemoteBranch extends RefBase {
    readonly type: RefType.RemoteHead;
  }

  export type ResolvedRef = [Ref, ...(Ref | Obj.Object)[]];
}

/**
 * A 'human' in git: author + email
 */
export interface Human {
  readonly name: string;
  readonly email: string;
}

/**
 * An item in reflog
 *
 * reflog only exists for 'mutable' ref, i.e. branch / HEAD, and not tags
 * also "stash" is a special ref whose reflog is a stack of temporary commits
 */
export interface RefLog {
  readonly from: SHA1;
  readonly to: SHA1;
  readonly by: Human;
  readonly at: Timestamp;
  readonly desc: string;
}

/**
 * Storing timezone separately
 * Bacause JS's "Date" type does not have meaningful timezone support
 *
 * UI may choose to format with moment.js
 */
export interface Timestamp {
  readonly utcSec: number;
  readonly tz: string;
}

export function isTimestamp(value: any): value is Timestamp {
  return !!(value && typeof value.utcSec === 'number' && value.tz);
}
