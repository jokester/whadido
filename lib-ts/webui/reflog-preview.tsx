import * as preact from "preact";
import * as lodash from "lodash";

import {
    GitRepo, ResolvedRef,
    Ref, Obj, Human, Timestamp, RefLog,
} from "../git";

import { RefDump } from "../analyze";

interface PreviewProps {
    reflogDump: RefDump[];
}

export class ReflogPreview extends preact.Component<PreviewProps, {}> {

    sortedTimestamp(dumps: RefDump[]) {
        const timestamps = lodash.flatten(
            dumps.map(d => d.reflog.map(f => f.at.utc_sec)));

        return lodash.uniq(timestamps).sort();
    }

    /**
     * A row shows all reflogs of one ref
     */
    reflogRow(refpath: string, timestamps: number[], reflogs: RefLog[]) {
        const cells: JSX.Element[] = [];

        if (!reflogs.length) {
            return (
                <div class="reflog-row" >
                    <p>refpath = {refpath} (no reflogs)</p>
                </div>
            );
        }

        return (
            <div class="reflog-row" >
                <p>refpath = {refpath}</p>
                {timestamps.map(t => this.reflogCell(t, reflogs))}
                (END)
            </div>
        );
    }

    /**
     * A cell is identified by (refpath && timestamp), may contain multiple reflog items.
     */
    reflogCell(timestamp: number, reflogs: RefLog[]) {
        const selected = reflogs.filter(r => r.at.utc_sec === timestamp);
        return (
            <div className="reflog-cell">
                {selected.length ? JSON.stringify(selected) : ""}
            </div>
        );
    }

    render(props: PreviewProps) {

        const timestamps = this.sortedTimestamp(props.reflogDump);

        return (
            <div className="reflog-preview" >
                {
                    props.reflogDump.map(dump => this.reflogRow(dump.path, timestamps, dump.reflog))
                }
            </div>
        );
    }
}
