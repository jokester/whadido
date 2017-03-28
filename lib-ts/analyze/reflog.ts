import * as lodash from "lodash";
import { Map as IMap } from "immutable";

import { detectRefpath, Timestamp, RefLog, CONST } from "../git";

import {
    Parser, unit, zero, bind, bind as ᐅ,
    lookAhead, filter, or, skip, seq2, seq3,
    biased, iterate, iterateN, reiterate,
} from "../parser";

import { RefDump, } from "../analyze";
import * as Op from "./operations";

type ReflogParser = Parser<RefDump, Op.Operation>;

// A immutable map
export type RefMap = IMap<string, RefDump>;

export function build(dumps: RefDump[]) {
    let m = IMap<string, RefDump>();
    for (const d of dumps) {
        if (m.has(d.path))
            throw new Error(`duplicated refpath: ${d.path}`);
        m = m.set(d.path, d);
    }
    return m;
}

export function countReflog(dumps: RefDump[]) {
    return dumps.map(d => d.reflog.length).reduce((a, b) => a + b, 0);
}

export function unmap(map: RefMap) {
    return Array.from(map.values());
}

export function analyzeDump(dumps: RefDump[]) {
    const map0 = build(dumps);

    const remoteBranchNames = Array.from(map0.keys())
        .filter(k => detectRefpath.remote_branch.exec(k));

    const localBranchNames = Array.from(map0.keys())
        .filter(k => detectRefpath.local_branch.exec(k));

    const pushRemoteBranch = remoteBranchNames.map(pushRemoteBranch1);
    const fetchRemoteBranch = remoteBranchNames.map(fetchRemoteBranch1);
    const commitLocalBranch = localBranchNames.map(commitLocalBranch1);
    const createLocalBranch = localBranchNames.map(createLocalBranch1);
    const mergeCurrentBranchFF = localBranchNames.map(mergeCurrentBranchFF1);
    const mergeCurrentBranch = localBranchNames.map(mergeCurrentBranch1);
    const resetCurrentBranch = localBranchNames.map(resetCurrentBranch1);
    const rebaseCurrentBranch = localBranchNames.map(rebaseCurrentBranch1);
    const rebaseCurrentBranchInteractive = localBranchNames.map(rebaseCurrentBranchInteractive1);
    const renameRemoteBranch = remoteBranchNames.map(renameRemoteBranch1);

    const parser = reiterate(
        biased(
            ...mergeCurrentBranchFF,
            ...mergeCurrentBranch,
            ...resetCurrentBranch,
            ...createLocalBranch,
            ...commitLocalBranch,
            localCheckout1,
            ...rebaseCurrentBranch,
            ...rebaseCurrentBranchInteractive,
            ...pushRemoteBranch,
            ...fetchRemoteBranch,
            ...renameRemoteBranch,
        ));
    return parser(map0);
}

/**
 * Push to a remote branch: "update by push"
 */
const pushRemoteBranch1 = (refPath: string) => bind<RefMap, RefLog, Op.Operation>(
    getLastReflog(refPath),
    (lastLog) => {
        if (/^update by push/.exec(lastLog.desc))
            return unit(new Op.RemotePush(refPath, lastLog));
        else
            return zero;
    });

const fetchRemoteBranch1 = (refPath: string) => bind<RefMap, RefLog, Op.Operation>(
    getLastReflog(refPath),
    (lastLog) => {
        if (/^fetch\W/.exec(lastLog.desc))
            return unit(new Op.RemoteFetch(refPath, lastLog));
        else
            return zero;
    });

const getLastReflog = (refpath: string) => <Parser<RefMap, RefLog>>((input: RefMap) => {
    const ref = input.get(refpath);
    if (ref && ref.reflog.length) {
        return [{
            output: lodash.last(ref.reflog),
            rest: input.set(refpath, Object.assign({}, ref, { reflog: lodash.initial(ref.reflog) })),
        }];
    }
    return [];
});

const commitLocalBranch1 = (branchPath: string) => seq2<RefMap, RefLog, RefLog, Op.Operation>(
    getLastReflog(CONST.HEAD),
    getLastReflog(branchPath),
    (headLast, branchLast) => {
        if (lodash.isEqual(headLast.at, branchLast.at)
            && /^commit( \(amend\))?:/.exec(headLast.desc)
            && headLast.desc === branchLast.desc) {
            return unit(new Op.LocalCommitInBranch(branchPath, headLast));
        }
        return zero;
    });

const createLocalBranch1 = (branchPath: string) => seq2<RefMap, RefLog, RefLog, Op.Operation>(
    getLastReflog(CONST.HEAD),
    getLastReflog(branchPath),
    (headLast, branchLast) => {
        if (lodash.isEqual(headLast.at, branchLast.at)
            && CONST.EMPTY_OBJ === branchLast.from
            && headLast.to === branchLast.to
            && /^checkout:/.exec(headLast.desc)
            && /^branch: Created/.exec(branchLast.desc)) {
            return unit(new Op.CreateLocateBranchAndCheckout(branchPath, branchLast));
        }
        return zero;
    });

/**
 * merge something into current branch, without creating new commit
 */
const mergeCurrentBranchFF1 = (branchPath: string) => seq2<RefMap, RefLog, RefLog, Op.Operation>(
    getLastReflog(CONST.HEAD),
    getLastReflog(branchPath),
    (headLast, branchLast) => {
        if (lodash.isEqual(headLast.at, branchLast.at)
            && headLast.from === branchLast.from
            && headLast.to === branchLast.to
            && /^merge .*?: Fast-forward$/.exec(headLast.desc)
            && headLast.desc === branchLast.desc) {
            return unit(new Op.MergeCurrentBranchFF(branchPath, branchLast));
        }
        return zero;
    });

/**
 * merge something into current branch, without creating new commit
 */
const mergeCurrentBranch1 = (branchPath: string) => seq2<RefMap, RefLog, RefLog, Op.Operation>(
    getLastReflog(CONST.HEAD),
    getLastReflog(branchPath),
    (headLast, branchLast) => {
        if (lodash.isEqual(headLast.at, branchLast.at)
            && headLast.from === branchLast.from
            && headLast.to === branchLast.to
            && (/^commit \(merge\):/.exec(headLast.desc) || /^merge .+?: Merge made by/.exec(headLast.desc))
            && headLast.desc === branchLast.desc) {
            return unit(new Op.MergeCurrentBranch(branchPath, branchLast));
        }
        return zero;
    });

const resetCurrentBranch1 = (branchPath: string) => seq2<RefMap, RefLog, RefLog, Op.Operation>(
    getLastReflog(CONST.HEAD),
    getLastReflog(branchPath),
    (headLast, branchLast) => {
        if (lodash.isEqual(headLast.at, branchLast.at)
            && headLast.from === branchLast.from
            && headLast.to === branchLast.to
            && /^reset: moving/.exec(headLast.desc)
            && headLast.desc === branchLast.desc) {
            return unit(new Op.ResetCurrentBranch(branchPath, branchLast));
        }
        return zero;
    });

const localCheckout1 = bind<RefMap, RefLog, Op.Operation>(
    getLastReflog(CONST.HEAD),
    (headLast) => {
        if (/^checkout: moving from /.exec(headLast.desc)) {
            return unit(new Op.Checkout(headLast));
        }
        return zero;
    });

const rebaseCurrentBranch1 = (branchPath: string) => bind<RefMap, RefLog, Op.Operation>(
    getLastReflog(branchPath),
    (branchLast) => (input: RefMap) => {
        if (! /^rebase finished: /.exec(branchLast.desc))
            return [];

        const head = input.get(CONST.HEAD);
        if (!head && head.reflog.length < 2)
            return [];

        const reflogs = head.reflog.slice();
        const headRebasing: RefLog[] = [];

        // last in HEAD should have message "rebase finished: ...":
        const headFinish: RefLog = reflogs.pop();
        if (! /^rebase finished: returning to /.exec(headFinish.desc))
            return [];

        let l: RefLog;
        while ((l = reflogs.pop()) && /^rebase: /.exec(l.desc)) {
            headRebasing.push(l);
            if (l.from === branchLast.from) {
                // yield result when we found the first commit in rebase actions
                const rest = input.set(CONST.HEAD, Object.assign({}, head, { reflog: reflogs }));
                return [{
                    output: new Op.RebaseCurrentBranch(branchPath, branchLast, headFinish, headRebasing),
                    rest
                }];
            }
        }
        return [];
    });

const rebaseCurrentBranchInteractive1 = (branchPath: string) => bind<RefMap, RefLog, Op.Operation>(
    getLastReflog(branchPath),
    (branchLast) => (input: RefMap) => {
        if (! /^rebase -i \(finish\): /.exec(branchLast.desc))
            return [];

        const head = input.get(CONST.HEAD);
        if (!head && head.reflog.length < 2)
            return [];

        const reflogs = head.reflog.slice();
        const headRebasing: RefLog[] = [];

        // last in HEAD should have message "rebase -i (finish):":
        const headFinish: RefLog = reflogs.pop();
        if (! /^rebase -i \(finish\): /.exec(headFinish.desc))
            return [];

        let l: RefLog;
        while ((l = reflogs.pop()) && /^rebase -i /.exec(l.desc)) {
            headRebasing.push(l);
            if (l.from === branchLast.from) {
                // yield result when we found the first commit in rebase actions
                const rest = input.set(CONST.HEAD, Object.assign({}, head, { reflog: reflogs }));
                return [{
                    output: new Op.RebaseCurrentBranchInteractive(
                        branchPath, branchLast, headFinish, headRebasing),
                    rest
                }];
            }
        }
        return [];
    });

const renameRemoteBranch1 = (remoteBranchPath: string) => bind<RefMap, RefLog, Op.Operation>(
    getLastReflog(remoteBranchPath),
    (lastReflog) => {
        if (/^remote: renamed /.exec(lastReflog.desc)) {
            return unit(new Op.RenameRemoteBranch(remoteBranchPath, lastReflog));
        }
        return zero;
    });