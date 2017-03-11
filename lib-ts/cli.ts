import * as path from 'path';

import { createParser, ParsedOptions } from './options';
import { openRepo, findRepo, GitRepo } from './git';
import { writeFile } from './util/io';
import { dumpRef } from './analyze';

function exit() {
    process.exit(0);
}

/**
 * captures top-level exception and show friendly message
 * @param error top-level exception
 */
function showError(error: Error) {
    if (error.message.match('Not a git repository')) {
        console.error('Repository not found');
    } else {
        console.error(error);
    }
    process.exit(1);
}

export async function main() {
    const options = createParser().parseArgs();

    try {
        await dump(options);
        exit();
    } catch (e) {
        showError(e);
    }
}

async function dump(options: ParsedOptions) {
    let repo: GitRepo;

    repo = await openRepo(options.path);

    const dump = await dumpRef(repo);

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

if (require.main === module) {
    main();
}
