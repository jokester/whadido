import { RefLog, Timestamp } from '../git';
import { freeze } from '../vendor/ts-commonutil/type';

/**
 * Recovered operations and text-ify
 */
const enum OpType {
  // remote branch only
  push = 'Push',
  fetch = 'Fetch',
  renameRemote = 'RenameRemote',

  // head + possible local branch
  merge = 'Merge',
  commit = 'Commit',
  createBranch = 'CreateBranch',
  rebaseInteractivelyFinished = 'RebaseInteractivelyFinished',
  rebaseInteractivelyAborted = 'RebaseInteractivelyAborted',
  rebaseFinished = 'RebaseFinished',
  clone = 'Clone',

  // HEAD only
  checkout = 'Checkout',
  reset = 'Reset',

  // head + remote + local
  pull = 'Pull',
}

export interface Operation {
  type: OpType;
}

namespace Operations {
  interface BaseOperation {
    type: OpType;
  }

  export interface Merge extends BaseOperation {
    type: OpType.merge;

    headLog: RefLog;
    refpath?: string;
    branchLog?: RefLog;
  }

  export interface Commit extends BaseOperation {
    type: OpType.commit;
    headLog: RefLog;
    refpath?: string;
    branchLog?: RefLog;
  }

  export interface CreateBranch extends BaseOperation {
    type: OpType.createBranch;
    branchLog: RefLog;
    branchPath: string;
    headCheckout: undefined | RefLog;
  }

  export interface Clone extends BaseOperation {
    type: OpType.clone;
    headLog: RefLog;
    branchpath: string | undefined;
    branchLog: RefLog | undefined;
  }

  export interface Fetch extends BaseOperation {
    type: OpType.fetch;
    refpath: string;
    branchLog: RefLog;
  }

  export interface Push extends BaseOperation {
    type: OpType.push;
    refpath: string;
    branchLog: RefLog;
  }

  export interface Pull extends BaseOperation {
    type: OpType.pull;
    headLog: RefLog;
  }

  export interface RenameRemote extends BaseOperation {
    type: OpType.renameRemote;
    refpath: string;
    branchLog: RefLog;
  }

  export interface Checkout extends BaseOperation {
    type: OpType.checkout;
    headLog: RefLog;
  }

  export interface Reset extends BaseOperation {
    type: OpType.reset;
    headLog: RefLog;
    branchpath: string | undefined;
    branchLog: RefLog | undefined;
  }

  export interface RebaseInteractiveAborted extends BaseOperation {
    type: OpType.rebaseInteractivelyAborted;
    headLogs: RefLog[];
  }

  export interface RebaseInteractiveFinished extends BaseOperation {
    type: OpType.rebaseInteractivelyFinished;
    headLogs: RefLog[];
    branchpath: string | undefined;
    branchLog: RefLog | undefined;
  }

  export interface RebaseFinished extends BaseOperation {
    type: OpType.rebaseFinished;
    headLogs: RefLog[];
    branchpath: string | undefined;
    branchLog: RefLog | undefined;
  }
}

export const operationFactory = freeze({
  merge(headLog: RefLog, refpath: string | undefined, branchLog: RefLog | undefined): Operations.Merge {
    return { type: OpType.merge, headLog, refpath, branchLog };
  },
  commit(headLog: RefLog, refpath: string | undefined, branchLog: RefLog | undefined): Operations.Commit {
    return { headLog, refpath, branchLog, type: OpType.commit };
  },
  createBranch(branchLog: RefLog, branchPath: string, headCheckout: RefLog | undefined): Operations.CreateBranch {
    return {
      type: OpType.createBranch,
      branchLog,
      branchPath,
      headCheckout,
    };
  },
  clone(headLog: RefLog, branchpath: string | undefined, branchLog: RefLog | undefined): Operations.Clone {
    return {
      type: OpType.clone,
      headLog,
      branchpath,
      branchLog,
    };
  },
  fetch(refpath: string, branchLog: RefLog): Operations.Fetch {
    return { type: OpType.fetch, refpath, branchLog };
  },
  push(refpath: string, branchLog: RefLog): Operations.Push {
    return { type: OpType.push, refpath, branchLog };
  },
  pull(headLog: RefLog): Operations.Pull {
    return { type: OpType.pull, headLog };
  },
  renameRemote(refpath: string, branchLog: RefLog): Operations.RenameRemote {
    return { type: OpType.renameRemote, refpath, branchLog };
  },
  checkout(headLog: RefLog): Operations.Checkout {
    return { type: OpType.checkout, headLog };
  },
  reset(headLog: RefLog, branchpath: string | undefined, branchLog: RefLog | undefined): Operations.Reset {
    return { type: OpType.reset, headLog, branchpath, branchLog };
  },
  rebaseInteractiveAborted(headLogs: RefLog[]): Operations.RebaseInteractiveAborted {
    return { type: OpType.rebaseInteractivelyAborted, headLogs };
  },
  rebaseInteractiveFinished(
    headLogs: RefLog[],
    branchpath: string | undefined,
    branchLog: RefLog | undefined,
  ): Operations.RebaseInteractiveFinished {
    return { type: OpType.rebaseInteractivelyFinished, headLogs, branchpath, branchLog };
  },
  rebaseFinished(
    headLogs: RefLog[],
    branchpath: string | undefined,
    branchLog: RefLog | undefined,
  ): Operations.RebaseFinished {
    return { type: OpType.rebaseFinished, headLogs, branchpath, branchLog };
  },
});
