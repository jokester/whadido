"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
var reflog_1 = require("./reflog");
exports.analyzeDump = reflog_1.analyzeDump;
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