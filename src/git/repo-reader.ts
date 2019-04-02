/**
 * Public interface for GitRepo
 */
import { Obj, Ref, RefLog } from './types';

export interface GitRepoReader {
  // normally `.git`
  readonly repoRoot: string;

  /**
   * @return {string[]} path of refs
   */
  listRefs(): Promise<Ref.Ref[]>;

  readObject(sha1: string): Promise<Obj.Object>;

  /**
   * read reflog of a specified ref
   */
  readReflog(refPath: string): Promise<RefLog[]>;

  /**
   * resolve ref by 1 level
   */
  readRef(ref: Ref.Ref): Promise<Ref.Ref | Obj.Object>;

  resolveRef(first: Ref.Ref): Promise<Ref.ResolvedRef>;
}
