import * as path from "path";

import { createParser, ParsedOptions } from "./options";
import { openRepo, findRepo, GitRepo } from "./git";
import { writeFile } from "./util/io";
import * as log from "./util/logger";
import { dumpRefs, analyzeDump } from "./analyze";

let logger = log.logger_silent;

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
        logger = log.logger_normal;

    try {
        logger.i(`Trying to locate repository from ${options.path}`);
        const repo = await openRepo(options.path);
        logger.i(`Found repository at ${repo.repoRoot}`);

        if (options.dump)
            await dump(options, repo);
        else
            await showReflog(repo);

        process.exit(0);
    } catch (e) {
        console.error(showError(e));
        process.exit(1);
    }
}

async function dump(options: ParsedOptions, repo: GitRepo) {

    const dump = await dumpRefs(repo);

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
        await writeFile(dumpFilename, dumpJSON);
        console.info(`dumped reflogs to ${dumpFilename}`);
    } catch (e) {
        console.error(`error dumping reflogs to ${dumpFilename}`);
        throw e;
    }
}

async function showReflog(repo: GitRepo) {
    logger.v(JSON.stringify(await repo.listRefs()));

    const refDump = await dumpRefs(repo);
    logger.v(JSON.stringify(refDump));

    const analyzed = analyzeDump(refDump)[0];

    if (!analyzed) {
        throw new Error("Failed to parse reflogs");
    }

    console.log(analyzed);

    const sortedOperations = analyzed.output.sort((op1, op2) => op1.end.utc_sec - op2.end.utc_sec);

    for (const op of sortedOperations) {
        console.info(op.toString());
    }

    logger.i("sorted operations", JSON.stringify(sortedOperations));
}

if (require.main === module) {
    main();
}
