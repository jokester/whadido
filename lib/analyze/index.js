"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const immutable_1 = require("immutable");
var reflog_1 = require("./reflog");
exports.topParser = reflog_1.topParser;
/**
 * create a RefState from dump of refs
 *
 * @param {RefDump[]} dump
 * @returns {RefState}
 */
function buildState(dump) {
    let s = immutable_1.Map();
    for (const d of dump) {
        if (s.has(d.path))
            throw new Error(`duplicated refpath: ${d.path}`);
        if (d.reflog.length)
            s = s.set(d.path, immutable_1.List(d.reflog));
    }
    return s;
}
exports.buildState = buildState;
/**
 * measure size of a RefState, by #reflog
 *
 * @export
 * @param {RefState} s
 * @returns num of reflogs
 */
function countReflog(s) {
    return s.valueSeq().reduce((a, b) => a + b.size, 0);
}
exports.countReflog = countReflog;
/**
 * overwrite {@param dump} with new reflogs in state
 *
 * only used for dev, to dump unrecognized items
 */
function unbuildState(dump, state) {
    return dump.map(d => (Object.assign({}, d, { reflog: state.get(d.path, immutable_1.List()).toJS() })));
}
exports.unbuildState = unbuildState;
function op2obj(op) {
    const p1 = { className: op.constructor.name };
    const p2 = JSON.parse(JSON.stringify(op));
    return Object.assign({}, p1, p2);
}
exports.op2obj = op2obj;
function dumpRefs(repo) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const refs = yield repo.listRefs();
        const dump = [];
        for (const r of refs) {
            const resolved = yield repo.resolveRef(r);
            const reflog = yield repo.readReflog(r.path);
            dump.push({
                path: r.path,
                ref: resolved,
                reflog,
            });
        }
        return dump;
    });
}
exports.dumpRefs = dumpRefs;
//# sourceMappingURL=index.js.map