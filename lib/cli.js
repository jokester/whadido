"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const options_1 = require("./options");
const git_1 = require("./git");
function exit() {
    process.exit(0);
}
function raise(error) {
    if (error.message.match('Not a git repository')) {
        console.error('Repository not found');
    }
    else {
        console.error(raise);
    }
    process.exit(1);
}
function main() {
    const options = options_1.createParser().parseArgs();
    if (options.dump) {
        dump(options)
            .then(exit, raise);
    }
}
exports.main = main;
function dump(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let repo;
        repo = yield git_1.openRepo(options.path);
        const refs = yield repo.listRefs();
        const dump = {};
        for (const r of refs) {
            const refDump = {};
            const resolved = refDump.resolved = yield repo.resolveRef(r);
            refDump.reflog = yield repo.readReflog(r.path);
            dump[r.path] = refDump;
        }
        console.log(JSON.stringify(dump, undefined, 4));
    });
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=cli.js.map