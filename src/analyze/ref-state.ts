import { List as IList, Map as IMap } from 'immutable';
import { Ref, RefLog } from '../git';
import { GitRepoReader } from '../git/repo-reader';

/**
 * all reflog items of a ref
 */
export interface RefHistory {
  path: string;
  ref: Ref.ResolvedRef;
  reflog: RefLog[];
}

/**
 * create a RefState from dump of refs
 *
 * @param {RefHistory[]} dump
 * @returns {RefState}
 */
export function buildState(dump: RefHistory[]): RefState {
  let s: RefState = IMap<string, IList<RefLog>>();
  for (const d of dump) {
    if (s.has(d.path)) {
      throw new Error(`duplicated refpath: ${d.path}`);
    }
    if (d.reflog.length) {
      s = s.set(d.path, IList(d.reflog));
    }
  }
  return s;
}

/**
 * put reflogs in {@param state} back to {@param dump} so that we can count remained reflogs
 *
 * only used for dev, to dump unrecognized items
 * @param state
 */
export function unbuildState(dump: RefHistory[], state: RefState): RefHistory[] {
  return dump.map(d => ({
    ...d,
    reflog: state.get(d.path, IList<RefLog>()).toJS(),
  }));
}

/**
 * (refPath: string) => RefLog[]
 */
export type RefState = IMap<string, IList<RefLog>>;

export type BranchTip = [string, RefLog];

/**
 * measure size of a RefState, by #reflog
 *
 * @export
 * @param {RefState} s
 * @returns num of reflogs
 */
export function countReflog(s: RefState) {
  return s.valueSeq().reduce((a, b) => a + b.size, 0);
}

export async function readRefHistory(repo: GitRepoReader): Promise<RefHistory[]> {
  const refs = await repo.listRefs();
  return Promise.all(
    refs.map(async r => ({
      path: r.path,
      ref: await repo.resolveRef(r),
      reflog: await repo.readReflog(r.path),
    })),
  );
}
