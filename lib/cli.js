"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path = require("path");
const options_1 = require("./options");
const git_1 = require("./git");
const io_1 = require("./util/io");
const log = require("./util/logger");
const analyze_1 = require("./analyze");
let logger = log.logger_silent;
/**
 * captures top-level exception and show friendly message
 * @param error top-level exception
 */
function showError(error) {
    if (error.message.match("Not a git repository")) {
        return "Repository not found";
    }
    else if (error.message) {
        return error.message;
    }
    else {
        return error;
    }
}
function main() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const options = options_1.createParser().parseArgs();
        if (options.verbose)
            logger = log.logger_normal;
        try {
            logger.i(`Trying to locate repository from ${options.path}`);
            const repo = yield git_1.openRepo(options.path);
            logger.i(`Found repository at ${repo.repoRoot}`);
            if (options.dump)
                yield dump(options, repo);
            else
                yield showReflog(repo);
            process.exit(0);
        }
        catch (e) {
            console.error(showError(e));
            process.exit(1);
        }
    });
}
exports.main = main;
function dump(options, repo) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const dump = yield analyze_1.dumpRefs(repo);
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
function showReflog(repo) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger.v(JSON.stringify(yield repo.listRefs()));
        const refDump = yield analyze_1.dumpRefs(repo);
        logger.v(JSON.stringify(refDump));
        const analyzed = analyze_1.analyzeDump(refDump)[0];
        if (!analyzed) {
            throw new Error("Failed to parse reflogs");
        }
        console.log(analyzed);
        const sortedOperations = analyzed.output.sort((op1, op2) => op1.end.utc_sec - op2.end.utc_sec);
        for (const op of sortedOperations) {
            console.info(op.toString());
        }
        logger.i("sorted operations", JSON.stringify(sortedOperations));
    });
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=cli.js.map