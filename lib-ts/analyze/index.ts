import { Map as IMap, List as IList, is } from "immutable";

import {
    GitRepo, ResolvedRef,
    Ref, Obj, Human, Timestamp, RefLog,
} from "../git";

import { Parser, unit } from "../parser";

import * as Op from "./operations";

export { topParser } from "./reflog";

export interface RefDump {
    path: string;
    ref: ResolvedRef;
    reflog: RefLog[];
}

export type RefState = IMap<string, IList<RefLog>>;

export type RefParser<T> = Parser<RefState, T>;

/**
 * create a RefState from dump of refs
 *
 * @param {RefDump[]} dump
 * @returns {RefState}
 */
export function buildState(dump: RefDump[]): RefState {
    let s: RefState = IMap<string, IList<RefLog>>();
    for (const d of dump) {
        if (s.has(d.path))
            throw new Error(`duplicated refpath: ${d.path}`);
        if (d.reflog.length)
            s = s.set(d.path, IList(d.reflog));
    }
    return s;
}

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

/**
 * overwrite {@param dump} with new reflogs in state
 *
 * only used for dev, to dump unrecognized items
 */
export function unbuildState(dump: RefDump[], state: RefState): RefDump[] {
    return dump.map(d => ({ ...d, reflog: state.get(d.path, IList<RefLog>()).toJS() }));
}

export function op2obj(op: Op.Operation & Object): {} {
    const p1 = { className: op.constructor.name };
    const p2 = JSON.parse(JSON.stringify(op)) as typeof op;
    return { ...p1, ...p2 };
}

export async function dumpRefs(repo: GitRepo) {
    const refs = await repo.listRefs();

    const dump = [] as RefDump[];
    for (const r of refs) {
        const resolved = await repo.resolveRef(r);
        const reflog = await repo.readReflog(r.path);
        dump.push({
            path: r.path,
            ref: resolved,
            reflog,
        });
    }

    return dump;
}
