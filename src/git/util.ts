import { PATTERNS } from './parser';

export function stripRefPrefix(refPath: string): string {
  let matched: null | RegExpExecArray;

  if ((matched = PATTERNS.refpath.remoteBranch.exec(refPath))) {
    // remote branch: strip the (^remotes/) part
    return matched[1];
  } else if ((matched = PATTERNS.refpath.localBranch.exec(refPath))) {
    // remote branch: strip the (^heads/) part
    return matched[1];
  }
  throw `cannot find prettyRef: ${refPath}`;
}
