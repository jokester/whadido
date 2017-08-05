"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const preact = require("preact");
const lodash = require("lodash");
class ReflogPreview extends preact.Component {
    sortedTimestamp(dumps) {
        const timestamps = lodash.flatten(dumps.map(d => d.reflog.map(f => f.at.utc_sec)));
        return lodash.uniq(timestamps);
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
            preact.h("p", null,
                "refpath = ",
                refpath)));
    }
    /**
     * A cell is identified by (refpath && timestamp), may contain multiple reflog items.
     */
    reflogCell(timestamp, reflogs) {
        const selected = reflogs.filter(r => r.at.utc_sec === timestamp);
        return (preact.h("div", { className: "reflog-cell" }, selected.map(this.reflogItem)));
    }
    reflogItem(reflog) {
        return (preact.h("div", { className: "reflog-item" },
            preact.h("p", { className: "reflog-time" }, new Date(reflog.at.utc_sec * 1e3).toISOString()),
            preact.h("p", { className: "reflog-time" }, JSON.stringify(reflog.at)),
            preact.h("p", { className: "reflog-sha1", alt: reflog.from }, reflog.from.slice(0, 6)),
            "\u2193",
            preact.h("p", { className: "reflog-sha1" }, reflog.to.slice(0, 6)),
            preact.h("p", { className: "reflog-message" }, reflog.desc)));
    }
    render(props) {
        const timestamps = this.sortedTimestamp(props.reflogDump);
        return (preact.h("div", { className: "reflog-preview" }, props.reflogDump
            .filter(r => r.reflog.length)
            .map(dump => this.reflogRow(dump.path, timestamps, dump.reflog))));
    }
}
exports.ReflogPreview = ReflogPreview;
//# sourceMappingURL=reflog-preview.js.map