import * as lodash from "lodash";
import { Map as IMap } from "immutable";

import { detectRefpath, Timestamp } from "../git";

import {
    Parser, unit, zero, bind, bind as ᐅ,
    lookAhead, filter, or, skip, seq2, seq3,
    biased, iterate, iterateN, reiterate,
} from "../parser";

import { RefDump } from "../analyze";
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

interface AnalyzeFlags {
    remotePush?: boolean;
    remoteFetch?: boolean;
}

const defaultAnalyzeFlags = {
    remotePush: true,
    remoteFetch: true,
};

export function analyzeDump(dumps: RefDump[], flags = defaultAnalyzeFlags) {
    const map0 = build(dumps);
    flags = flags || defaultAnalyzeFlags;

    const remoteBranchNames = Array.from(map0.keys())
        .filter(k => detectRefpath.remote_branch.exec(k));

    const pushRemoteBranch = flags.remotePush ? remoteBranchNames.map(pushRemoteBranch1) : [];
    const fetchRemoteBranch = flags.remoteFetch ? remoteBranchNames.map(fetchRemoteBranch1) : [];

    const parser = reiterate(biased(...pushRemoteBranch, ...fetchRemoteBranch));
    return parser(map0);
}

/**
 * Push to a remote branch: "update by push"
 */
const pushRemoteBranch1 = (refPath: string) => <Parser<RefMap, Op.Operation>>((input: RefMap) => {
    const ref = input.get(refPath);
    const lastLog = lodash.last(ref.reflog);
    if (!(lastLog && /^update by push/.exec(lastLog.desc)))
        return [];

    const rest: RefDump = Object.assign({}, ref, { reflog: lodash.initial(ref.reflog) });
    return [{
        output: new Op.RemotePush(refPath, lastLog),
        rest: input.set(refPath, rest)
    }];
});

const fetchRemoteBranch1 = (refPath: string) => <Parser<RefMap, Op.Operation>>((input: RefMap) => {
    const ref = input.get(refPath);
    const lastLog = lodash.last(ref.reflog);
    if (!(lastLog && /^fetch\W/.exec(lastLog.desc)))
        return [];

    const rest: RefDump = Object.assign({}, ref, { reflog: lodash.initial(ref.reflog) });
    return [{
        output: new Op.RemoteFetch(refPath, lastLog),
        rest: input.set(refPath, rest)
    }];
});