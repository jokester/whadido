import * as path from 'path';

import { createOptionParser, ParsedOptions } from './options';
import { openRepo } from './git';
import { topParser } from './analyze';
import { GitRepoReader } from './git/repo-reader';
import { getLogger } from './util/logging';
import { buildState, countReflog, dumpRefs } from './analyze/ref-state';
import { fsp } from './util/fsp';

const logger = getLogger(__filename, 'WARN');

/**
 * captures top-level exception and show friendly message
 * @param error top-level exception
 */
function showError(error: Error) {
  if (error.message.match('Not a git repository')) {
    return 'Repository not found';
  }
  if (error.message) {
    return error.message;
  }
  return error;
}

export async function main() {
  const options = createOptionParser().parseArgs();
  if (options.verbose) {
    logger.setLevel('INFO');
  }

  try {
    logger.info(`Trying to locate repository from ${options.path}`);
    const repo = await openRepo(options.path);
    logger.info(`Found repository at ${repo.repoRoot}`);

    if (options.dump) {
      await dump(options, repo);
    } else {
      await showReflog(repo);
    }

    process.exit(0);
  } catch (e) {
    console.error(showError(e), e);
    process.exit(1);
  }
}

async function dump(options: ParsedOptions, repo: GitRepoReader) {
  const dump = await dumpRefs(repo);

  const dumpJSON = JSON.stringify(dump, undefined, 4);

  const now = new Date();

  const timeSegments = [now.getTime()];

  const dumpFilename = path.join(process.cwd(), `whadido-dump-${timeSegments.join('-')}.json`);

  try {
    await fsp.writeFile(dumpFilename, dumpJSON);
    console.info(`dumped reflogs to ${dumpFilename}`);
  } catch (e) {
    console.error(`error dumping reflogs to ${dumpFilename}`);
    throw e;
  }
}

async function showReflog(repo: GitRepoReader) {
  // logger.v(JSON.stringify(await repo.listRefs()));

  const refDump = await dumpRefs(repo);
  const initState = buildState(refDump);
  const numReflogs = countReflog(initState);
  logger.debug(JSON.stringify(refDump));

  const results = topParser(initState);
  const result0 = results[0];

  if (!result0) {
    throw new Error('Failed to parse reflogs');
  } else if (results.length > 1) {
    logger.warn('ambiguities in parsing');
  }

  for (const op of result0.output) {
    // TODO: custom renderer
    logger.info(op.toString());
  }

  const remained = countReflog(result0.rest);

  if (remained) {
    logger.warn(`Could not analyze ${remained} / ${numReflogs} reflog items.`);
  }

  // logger.i("sorted operations", JSON.stringify(sortedOperations));
}
