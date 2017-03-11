"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
function dumpRef(repo) {
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
exports.dumpRef = dumpRef;
class Analyzer {
    constructor(repo) {
        this.repo = repo;
    }
    analyze() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
        });
    }
    readRef() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return [];
        });
    }
}
exports.Analyzer = Analyzer;
//# sourceMappingURL=index.js.map