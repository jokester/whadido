import * as preact from "preact";

import {
    GitRepo, ResolvedRef,
    Ref, Obj, Human, Timestamp, RefLog,
} from "../git";

import { RefDump } from "../analyze";

interface PreviewProps {
    reflogDump: RefDump[];
}

export class ReflogPreview extends preact.Component<PreviewProps, {}> {

    render(props: PreviewProps) {

        let timestamps: number[] = [];
        for (const r of props.reflogDump) {
            for (const f of r.reflog) {
                timestamps.push(f.at.utc_sec);
            }
        }
        timestamps = timestamps.sort().filter((v, index, all) => v !== all[index - 1]);
        const refs = props.reflogDump.map(dump => <p>{dump.path}</p>);

        return <div>{timestamps.map(t => <p>{t}</p>)}</div>;
        // return <div>{refs}</div>;
    }
}

interface ReflowColumnProps {
    refPath: string;
    timestamps: Date[];
    rows: {
        timestampIndex: number;
        reflog: RefLog;
    }[];
}

class ReflowColumn {

}