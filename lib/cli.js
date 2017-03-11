"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path = require("path");
const options_1 = require("./options");
const git_1 = require("./git");
const io_1 = require("./util/io");
const analyze_1 = require("./analyze");
function exit() {
    process.exit(0);
}
/**
 * captures top-level exception and show friendly message
 * @param error top-level exception
 */
function showError(error) {
    if (error.message.match('Not a git repository')) {
        console.error('Repository not found');
    }
    else {
        console.error(error);
    }
    process.exit(1);
}
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const options = options_1.createParser().parseArgs();
        try {
            yield dump(options);
            exit();
        }
        catch (e) {
            showError(e);
        }
    });
}
exports.main = main;
function dump(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let repo;
        repo = yield git_1.openRepo(options.path);
        const dump = yield analyze_1.dumpRef(repo);
        const dumpJSON = JSON.stringify(dump, undefined, 4);
        const now = new Date();
        const timeSegments = [
            now.getTime(),
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            now.getUTCHours(),
            now.getUTCMinutes(),
            now.getUTCSeconds()
        ];
        const dumpFilename = path.join(process.cwd(), `whadido-dump-${timeSegments.join("-")}.json`);
        try {
            yield io_1.writeFile(dumpFilename, dumpJSON);
            console.info(`dumped reflogs to ${dumpFilename}`);
        }
        catch (e) {
            console.error(`error dumping reflogs to ${dumpFilename}`);
            throw e;
        }
    });
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=cli.js.map