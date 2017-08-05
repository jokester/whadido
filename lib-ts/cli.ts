import * as path from "path";

import { createParser, ParsedOptions } from "./options";
import { openRepo, findRepo, GitRepo } from "./git";
import { FS } from "./common/io";

const { writeFile } = FS;

import * as log from "./common/util/logger";
import { buildState, unbuildState, dumpRefs, countReflog, topParser, } from "./analyze";

const logger = log.createLogger(3);

/**
 * captures top-level exception and show friendly message
 * @param error top-level exception
 */
function showError(error: Error) {
    if (error.message.match("Not a git repository")) {
        return "Repository not found";
    } else if (error.message) {
        return error.message;
    } else {
        return error;
    }
}

export async function main() {
    const options = createParser().parseArgs();
    if (options.verbose)
        logger.setVerbosity(3);

    try {
        logger.info(`Trying to locate repository from ${options.path}`);
        const repo = await openRepo(options.path);
        logger.info(`Found repository at ${repo.repoRoot}`);

        if (options.dump)
            await dump(options, repo);
        else
            await showReflog(repo);

        process.exit(0);
    } catch (e) {
        console.error(showError(e), e);
        process.exit(1);
    }
}

async function dump(options: ParsedOptions, repo: GitRepo) {

    const dump = await dumpRefs(repo);

    const dumpJSON = JSON.stringify(dump, undefined, 4);

    const now = new Date();

    const timeSegments = [
        now.getTime(),
    ];

    const dumpFilename = path.join(process.cwd(), `whadido-dump-${timeSegments.join("-")}.json`);

    try {
        await writeFile(dumpFilename, dumpJSON);
        console.info(`dumped reflogs to ${dumpFilename}`);
    } catch (e) {
        console.error(`error dumping reflogs to ${dumpFilename}`);
        throw e;
    }
}

async function showReflog(repo: GitRepo) {
    // logger.v(JSON.stringify(await repo.listRefs()));

    const refDump = await dumpRefs(repo);
    const initState = buildState(refDump);
    const numReflogs = countReflog(initState);
    logger.debug(JSON.stringify(refDump));

    const result0 = topParser(initState)[0];

    if (!result0) {
        throw new Error("Failed to parse reflogs");
    }

    for (const op of result0.output) {
        console.info(op.toString());
    }

    const remained = countReflog(result0.rest);

    if (remained) {
        logger.warn(`Could not analyze ${remained} / ${numReflogs} reflog items.`);
    }

    // logger.i("sorted operations", JSON.stringify(sortedOperations));
}

if (require.main === module) {
    main();
}
