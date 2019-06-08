import { extractOperationTimestamp, Operation, Operations, OpType } from '../analyze/operations';
import { ReflogFormatter } from '../formatter/text-line-formatter';
import { PATTERNS } from '../git/parser';
import { getLogger } from '../util/logging';
import { CONST } from '../analyze/util';
import { first, last, uniq } from 'lodash';
import { Arrays } from '../util/arrays';
import { stripRefPrefix } from '../git/util';

const logger = getLogger(__filename, 'DEBUG');

export function cliLegend(sink: ReflogFormatter) {
  sink
    .line(l =>
      l
        .text('Legends:')
        .localRef('local reference')
        .remoteRef('remote reference')
        .sha1('sha1')
        .commitish('commit-ish'),
    )
    .line();
}

export function cliFormat(sortedOperations: Operation[], sink: ReflogFormatter) {
  for (const o of sortedOperations) {
    if (o.type === OpType.checkout) {
      OperationFormat.checkout(o, sink);
    } else if (o.type === OpType.push) {
      OperationFormat.push(o, sink);
    } else if (o.type === OpType.fetch) {
      OperationFormat.fetch(o, sink);
    } else if (o.type === OpType.commit) {
      OperationFormat.commit(o, sink);
    } else if (o.type === OpType.merge) {
      OperationFormat.merge(o, sink);
    } else if (o.type === OpType.createBranch) {
      OperationFormat.createBranch(o, sink);
    } else if (o.type === OpType.reset) {
      OperationFormat.reset(o, sink);
    } else if (o.type === OpType.renameRemote) {
      OperationFormat.renameRemote(o, sink);
    } else if (o.type === OpType.rebaseInteractivelyFinished) {
      OperationFormat.rebaseInteractivelyFinished(o, sink);
    } else if (o.type === OpType.remoteOnlyPull) {
      OperationFormat.remoteOnlyPull(o, sink);
    } else if (o.type === OpType.pull) {
      OperationFormat.pull(o, sink);
    } else if (o.type === OpType.rebaseFinished) {
      OperationFormat.rebaseFinished(o, sink);
    } else if (o.type === OpType.clone) {
      OperationFormat.clone(o, sink);
    } else {
      if (sink.debugEnabled) {
        sink.line(l => l.text('======================')).debug(o);
      }
      sink.line(line => line.errorText(`TODO: ${o.type}`));
    }

    sink.line();
  }
}

namespace OperationFormat {
  export function checkout(o: Operations.Checkout, sink: ReflogFormatter) {
    const { headLog } = o;
    const [before, after] = extractCheckoutPath(headLog.desc);
    sink
      .line(l => {
        l.timestamp(headLog.at);
      })
      .line(l => {
        l.pad()
          .text('git checkout: from')
          .localRef(before)
          .text('to')
          .localRef(after);
      })
      .line(l =>
        l
          .pad()
          .localRef(CONST.HEAD)
          .sha1Array(headLog.from, headLog.to),
      );
  }

  export function push(o: Operations.Push, sink: ReflogFormatter) {
    const { refpath, branchLog } = o;
    sink
      .line(l => l.timestamp(branchLog.at))
      .line(l => {
        l.pad()
          .text('git push: update')
          .remoteRef(stripRefPrefix(refpath))
          .sha1Array(branchLog.from, branchLog.to);
      });
  }

  export function fetch(o: Operations.Fetch, sink: ReflogFormatter) {
    const { refpath, branchLog } = o;
    sink
      .line(l => l.timestamp(branchLog.at))
      .line(l =>
        l
          .pad()
          .text('git fetch: update')
          .remoteRef(stripRefPrefix(refpath))
          .sha1Array(branchLog.from, branchLog.to),
      );
  }

  export function commit(o: Operations.Commit, sink: ReflogFormatter) {
    const { refpath, branchLog, headLog } = o;
    sink
      .line(l => l.timestamp(headLog.at))
      .line(l =>
        l
          .pad()
          .text('git commit: create commit')
          .sha1(headLog.to),
      )
      .line(l => {
        if (refpath && branchLog) {
          l.pad()
            .localRef(stripRefPrefix(refpath))
            .text('and')
            .localRef(CONST.HEAD)
            .text(':')
            .sha1Array(headLog.from, headLog.to);
        } else {
          l.pad()
            .localRef(CONST.HEAD)
            .text(':')
            .sha1Array(headLog.from, headLog.to);
        }
      });
  }

  export function merge(o: Operations.Merge, sink: ReflogFormatter) {
    const { headLog, refpath, branchLog } = o;
    const [mergee, isFF] = extractMergee(headLog.desc);

    sink.line(l => l.timestamp(headLog.at));
    sink.line(l => l.pad().text(`git merge (${isFF ? 'fast-forward' : 'not fast-forward'})`));

    if (refpath && branchLog) {
      sink
        .line(l => {
          l.pad().text('merge');

          if (PATTERNS.refpath.remoteBranch.test(mergee)) {
            l.remoteRef(mergee)
              .text('into')
              .localRef(stripRefPrefix(refpath));
          } else {
            l.localRef(mergee)
              .text('into')
              .localRef(stripRefPrefix(refpath));
          }
        })
        .line(l =>
          l
            .pad()
            .localRef(stripRefPrefix(refpath))
            .text('and')
            .localRef(CONST.HEAD)
            .text(':')
            .sha1Array(headLog.from, headLog.to),
        );
    } else {
      sink
        .line(l => {
          l.pad().text('merge');

          if (PATTERNS.refpath.remoteBranch.test(mergee)) {
            l.remoteRef(mergee)
              .text('into')
              .localRef('unknown branch');
          } else {
            l.localRef(mergee)
              .text('into')
              .localRef('unknown branch');
          }
        })
        .line(l =>
          l
            .pad()
            .localRef('unknown branch')
            .text('and')
            .localRef(CONST.HEAD)
            .text(':')
            .sha1Array(headLog.from, headLog.to),
        );
    }
  }

  export function createBranch(o: Operations.CreateBranch, sink: ReflogFormatter) {
    const { branchPath, branchLog, headCheckout } = o;
    sink.line(l => l.timestamp(branchLog.at));

    if (headCheckout) {
      sink
        .line(l => {
          l.pad()
            .text('git checkout --branch : create')
            .localRef(stripRefPrefix(branchPath))
            .text('at')
            .sha1(branchLog.to);
        })
        .line(l => {
          l.pad()
            .localRef(CONST.HEAD)
            .text(': from')
            .sha1(headCheckout.from)
            .text('to')
            .sha1(headCheckout.to);
        });
    } else {
      sink.line(l => {
        l.pad()
          .text('git branch : create')
          .localRef(branchPath)
          .text('at')
          .sha1(branchLog.to);
      });
    }
  }

  export function reset(o: Operations.Reset, sink: ReflogFormatter) {
    const { headLog, branchpath, branchLog } = o;

    sink.line(l => l.timestamp(headLog.at));

    const resetee = extractResetee(headLog.desc);

    if (branchpath && branchLog) {
      sink
        .line(l => {
          l.pad()
            .text('git reset : reset')
            .localRef(stripRefPrefix(branchpath))
            .text('to');
          if (PATTERNS.refpath.remoteBranch.test(resetee)) {
            l.remoteRef(stripRefPrefix(resetee));
          } else if (PATTERNS.refpath.localBranch.test(resetee)) {
            l.localRef(stripRefPrefix(resetee));
          } else if (PATTERNS.refpath.localHead.test(resetee)) {
            l.localRef(resetee);
          } else {
            l.sha1(resetee);
          }
        })
        .line(l => {
          l.pad()
            .localRef(stripRefPrefix(branchpath))
            .text('and')
            .localRef(CONST.HEAD)
            .text(':')
            .sha1Array(headLog.from, headLog.to);
        });
    } else {
      sink
        .line(l => {
          l.pad()
            .text('git reset : reset')
            .localRef(CONST.HEAD)
            .text('to');
          if (PATTERNS.refpath.remoteBranch.test(resetee)) {
            l.remoteRef(stripRefPrefix(resetee));
          } else if (PATTERNS.refpath.localBranch.test(resetee)) {
            l.localRef(stripRefPrefix(resetee));
          } else if (PATTERNS.refpath.localHead.test(resetee)) {
            l.localRef(resetee);
          } else {
            l.sha1(resetee);
          }
        })
        .line(l => {
          l.pad()
            .localRef(CONST.HEAD)
            .text(':')
            .sha1Array(headLog.from, headLog.to);
        });
    }
  }

  export function renameRemote(o: Operations.RenameRemote, sink: ReflogFormatter) {
    const { refpath, branchLog } = o;

    const [before, after] = extractOriginRenamedBranch(branchLog.desc);
    sink
      .line(l => l.timestamp(branchLog.at))
      .line(l => {
        l.pad().text('git remote rename');
      })
      .line(l => {
        l.pad()
          .text('rename')
          .remoteRef(stripRefPrefix(before))
          .text('(was at')
          .sha1(branchLog.from)
          .text(') to')
          .remoteRef(stripRefPrefix(after));
      });
  }

  export function rebaseInteractivelyFinished(o: Operations.RebaseInteractiveFinished, sink: ReflogFormatter) {
    const { headLogs, branchpath, branchLog } = o;

    const firstHeadLog = first(headLogs)!;
    const lastHeadLog = last(headLogs)!;
    sink.line(l => l.timestamp(lastHeadLog.at)).line(l => l.pad().text('git rebase --interactive'));

    let match: null | RegExpMatchArray;

    if (branchLog && branchpath) {
      // use refpath from branchpath
      sink.line(l =>
        l
          .pad()
          .text('rebase')
          .localRef(stripRefPrefix(branchpath))
          .text('onto')
          .sha1(firstHeadLog.to),
      );

      sink.line(l =>
        l
          .pad()
          .localRef(stripRefPrefix(branchpath))
          .sha1Array(branchLog.from, branchLog.to),
      );
    } else if ((match = /* (rebase ... returning to ...*/ /to (\S+)$/.exec(lastHeadLog.desc))) {
      const branchpath = match[1];
      // use refpath from branchpath
      sink.line(l =>
        l
          .pad()
          .text('rebase')
          .localRef(stripRefPrefix(branchpath))
          .text('onto')
          .sha1(firstHeadLog.to),
      );

      sink.line(l =>
        l
          .pad()
          .localRef(stripRefPrefix(branchpath))
          .sha1Array(firstHeadLog.from, lastHeadLog.to),
      );
    }
  }

  export function remoteOnlyPull(o: Operations.RemoteOnlyPull, sink: ReflogFormatter) {
    const {
      branchpath,
      branchLog: { from, to, at },
    } = o;
    sink
      .line(l => l.timestamp(at))
      .line(l => {
        l.pad()
          .text('git pull: update')
          .remoteRef(stripRefPrefix(branchpath))
          .sha1(from)
          .text('to')
          .sha1(to);
      });
  }

  export function pull(o: Operations.Pull, sink: ReflogFormatter): void {
    const { headLog, localBranchLog, localBranchPath, remoteBranchLog, remoteBranchPath } = o;

    sink.line(l => l.timestamp(headLog.at));

    if (localBranchLog && remoteBranchLog && Arrays.allEqual([localBranchLog.from, remoteBranchLog.from])) {
      sink.line(l =>
        l
          .pad()
          .text('git pull: update')
          .localRef(CONST.HEAD)
          .text(',')
          .localRef(stripRefPrefix(localBranchPath!))
          .text('and')
          .remoteRef(stripRefPrefix(remoteBranchPath!))
          .sha1Array(localBranchLog.from, localBranchLog.to),
      );
    } else if (localBranchLog && remoteBranchLog /* but not same from+to */) {
      sink
        .line(l =>
          l
            .pad()
            .text('git pull: update')
            .localRef(CONST.HEAD)
            .text('and')
            .localRef(stripRefPrefix(localBranchPath!))
            .sha1Array(localBranchLog.from, localBranchLog.to)
            .text(',')
            .localRef(stripRefPrefix(remoteBranchPath!))
            .sha1Array(remoteBranchLog.from, remoteBranchLog.to),
        )
        .line(l => l.pad());
    } else {
      // FIXME: this ignores remoteBranch*
      sink.line(l =>
        l
          .pad()
          .text('git pull: update')
          .localRef(CONST.HEAD)
          .text('and')
          .localRef(localBranchPath ? stripRefPrefix(localBranchPath) : '(unknown)')
          .sha1Array(headLog.from, headLog.to),
      );
    }
  }

  export function clone(o: Operations.Clone, sink: ReflogFormatter): void {
    sink.line(l => l.timestamp(o.headLog.at));

    const { branchPath, branchLog, headLog } = o;

    if (branchLog && branchPath) {
      sink.line(l =>
        l
          .pad()
          .text('git clone:')
          .localRef(CONST.HEAD)
          .text('and')
          .localRef(stripRefPrefix(branchPath))
          .text('created at')
          .sha1(branchLog.to),
      );
    } /* only HEAD */ else {
      sink.line(l =>
        l
          .pad()
          .text('git clone:')
          .localRef(CONST.HEAD)
          .text('created at')
          .sha1(headLog.to),
      );
    }
  }

  export function rebaseFinished(o: Operations.RebaseFinished, sink: ReflogFormatter) {
    const { headLogs, branchLog, branchpath } = o;

    const [headLog1] = headLogs;
    const headLogLast = headLogs[headLogs.length - 1];

    const base = extractRebaseBase(headLog1.desc);
    const rebasee = extractRebasedBranch(headLogLast.desc);
    sink
      .line(l => l.timestamp(headLog1.at))
      .line(l =>
        l
          .pad()
          .text('git rebase (finished): rebase')
          .localRef(stripRefPrefix(rebasee))
          .text('onto')
          .commitish(base),
      )
      .line(l => {
        l.pad()
          .localRef(CONST.HEAD)
          .text(':')
          .sha1Array(...Arrays.removeConsequecitiveDup([headLog1.from, ...headLogs.map(_ => _.to)]));
      });

    if (branchpath && branchLog) {
      sink.line(l => {
        l.pad()
          .commitish(branchpath)
          .text(':')
          .sha1Array(branchLog.from, branchLog.to);
      });
    }

    // TODO: print branchLog
  }

  export function wtf(o: Operations.Fetch, sink: ReflogFormatter) {}

  //////// utils
  function extractMergee(reflogDesc: string): [string, boolean] {
    let matched: null | RegExpMatchArray;
    if ((matched = /^merge (.*?): Fast-forward$/.exec(reflogDesc))) {
      return [matched[1], true];
    } else if ((matched = /^merge (.*)$/.exec(reflogDesc))) {
      return [matched[1], false];
    }
    throw `cannot find mergee: ${JSON.stringify(reflogDesc)}`;
  }

  function extractResetee(reflogDesc: string): string {
    let matched: null | RegExpMatchArray;
    if ((matched = /^reset: moving to (.*)$/.exec(reflogDesc))) {
      return matched[1];
    }
    throw `cannot find resetee: ${JSON.stringify(reflogDesc)}`;
  }

  // extract from """rebase finished: returning to {refs/heads/BRANCH}"""
  function extractRebasedBranch(reflogDesc: string): string {
    let matched: null | RegExpMatchArray;
    if ((matched = /^rebase (finished)?: returning to (.*)$/.exec(reflogDesc))) {
      return matched[2];
    }
    throw `cannot extract rebase branch: ${JSON.stringify(reflogDesc)}`;
  }

  // extract from """rebase: checkout {origin/master}"""
  function extractRebaseBase(reflogDesc: string): string {
    let matched: null | RegExpMatchArray;
    if ((matched = /^rebase: checkout (.*)$/.exec(reflogDesc))) {
      return matched[1];
    }

    throw `cannot extract rebase base: ${JSON.stringify(reflogDesc)}`;
  }

  function extractCheckoutPath(reflogDesc: string): [string, string] {
    let matched: null | RegExpMatchArray;
    if ((matched = /^checkout: moving from (.*?) to (.*?)$/.exec(reflogDesc))) {
      return [matched[1], matched[2]];
    }
    throw `cannot find checkoutPath: ${JSON.stringify(reflogDesc)}`;
  }

  function extractOriginRenamedBranch(reflogDesc: string): [string, string] {
    let matched: null | RegExpMatchArray;
    if ((matched = /^remote: renamed (.*?) to (.*)$/.exec(reflogDesc))) {
      return [matched[1], matched[2]];
    }
    throw `cannot extract origin-renamed branch: ${JSON.stringify(reflogDesc)}`;
  }
}
