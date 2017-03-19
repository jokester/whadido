"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const preact = require("preact");
const lodash = require("lodash");
class ReflogPreview extends preact.Component {
    sortedTimestamp(dumps) {
        const timestamps = lodash.flatten(dumps.map(d => d.reflog.map(f => f.at.utc_sec)));
        return lodash.uniq(timestamps).sort();
    }
    /**
     * A row shows all reflogs of one ref
     */
    reflogRow(refpath, timestamps, reflogs) {
        const cells = [];
        if (!reflogs.length) {
            return (preact.h("div", { class: "reflog-row" },
                preact.h("p", null,
                    "refpath = ",
                    refpath,
                    " (no reflogs)")));
        }
        return (preact.h("div", { class: "reflog-row" },
            preact.h("p", null,
                "refpath = ",
                refpath),
            timestamps.map(t => this.reflogCell(t, reflogs)),
            "(END)"));
    }
    /**
     * A cell is identified by (refpath && timestamp), may contain multiple reflog items.
     */
    reflogCell(timestamp, reflogs) {
        const selected = reflogs.filter(r => r.at.utc_sec === timestamp);
        return (preact.h("div", { className: "reflog-cell" }, selected.length ? JSON.stringify(selected) : ""));
    }
    render(props) {
        const timestamps = this.sortedTimestamp(props.reflogDump);
        return (preact.h("div", { className: "reflog-preview" }, props.reflogDump.map(dump => this.reflogRow(dump.path, timestamps, dump.reflog))));
    }
}
exports.ReflogPreview = ReflogPreview;
//# sourceMappingURL=reflog-preview.js.map