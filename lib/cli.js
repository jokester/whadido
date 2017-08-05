"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path = require("path");
const options_1 = require("./options");
const git_1 = require("./git");
const io_1 = require("./common/io");
const { writeFile } = io_1.FS;
const log = require("./common/util/logger");
const analyze_1 = require("./analyze");
const logger = log.createLogger(3);
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
            logger.setVerbosity(3);
        try {
            logger.info(`Trying to locate repository from ${options.path}`);
            const repo = yield git_1.openRepo(options.path);
            logger.info(`Found repository at ${repo.repoRoot}`);
            if (options.dump)
                yield dump(options, repo);
            else
                yield showReflog(repo);
            process.exit(0);
        }
        catch (e) {
            console.error(showError(e), e);
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
        ];
        const dumpFilename = path.join(process.cwd(), `whadido-dump-${timeSegments.join("-")}.json`);
        try {
            yield writeFile(dumpFilename, dumpJSON);
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
        // logger.v(JSON.stringify(await repo.listRefs()));
        const refDump = yield analyze_1.dumpRefs(repo);
        const initState = analyze_1.buildState(refDump);
        const numReflogs = analyze_1.countReflog(initState);
        logger.debug(JSON.stringify(refDump));
        const result0 = analyze_1.topParser(initState)[0];
        if (!result0) {
            throw new Error("Failed to parse reflogs");
        }
        for (const op of result0.output) {
            console.info(op.toString());
        }
        const remained = analyze_1.countReflog(result0.rest);
        if (remained) {
            logger.warn(`Could not analyze ${remained} / ${numReflogs} reflog items.`);
        }
        // logger.i("sorted operations", JSON.stringify(sortedOperations));
    });
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=cli.js.map