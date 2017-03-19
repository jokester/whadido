import {
    GitRepo, ResolvedRef,
    Ref, Obj, Human, Timestamp, RefLog,
} from "../git";

export interface RefDump {
    path: string;
    ref: ResolvedRef;
    reflog: RefLog[];
}

export { analyzeDump } from "./reflog";

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
