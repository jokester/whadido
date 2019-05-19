import { createOptionParser, ParsedOptions } from './options';
import { topParser } from '../analyze';
import { GitRepoReader } from '../git/repo-reader';
import { getLogger } from '../util/logging';
import { buildState, countReflog, readRefHistory } from '../analyze/ref-state';
import { GitRepoException } from '../git/error';
import { ChalkFormatter } from '../formatter/chalk-formatter';
import { cliFormat } from './cli-format';
import { createDump } from './create-dump';
import * as util from 'util';
import { findRepo, openRepo } from '../git/find-repo';

const logger = getLogger(__filename, 'WARN');

/**
 * captures top-level exception and show friendly message
 * @param error top-level exception
 */
function showError(error: unknown) {
  if (error instanceof GitRepoException) {
    return error.message;
  } else if (error instanceof Error) {
    return error.message;
  }
  return error;
}

export async function cliMain() {
  const options = createOptionParser().parseArgs();
  if (options.verbose) {
    logger.setLevel('INFO');
  }

  const formatter = new ChalkFormatter({
    printLn: (...s) => console.log(...s),
    gitSha1Length: 8,
    debug: true,
  });

  try {
    formatter.line(l => l.comment(`Searching git repository from ${options.path}`));
    const repoRoot = await findRepo(options.path);
    if (!repoRoot) {
      formatter.line(l => l.warnText(`Cannot find a repository at ${options.path}`));
      process.exit(1);
      return;
    }
    const repo = await openRepo(repoRoot);
    formatter.line(l => l.comment(`Found repository at ${repo.repoRoot}`));

    if (options.dump) {
      await createDump(options, repo);
      process.exit(0);
    } else {
      const ret = await showReflog(repo, formatter, options);
      process.exit(ret);
    }
  } catch (e) {
    console.error(util.format('%o', e));
    process.exit(2);
  }
}

async function showReflog(repo: GitRepoReader, formatter: ChalkFormatter, option: ParsedOptions): Promise<number> {
  const refHistory = await readRefHistory(repo);
  const initState = buildState(refHistory);
  const numReflogs = countReflog(initState);

  const results = topParser(initState);
  const [result0, result1] = results;

  if (!result0) {
    formatter.line(l => l.errorText('Could not recognize reflogs'));
    return 2;
  } else if (result1) {
    formatter.line(l => l.warnText('Got ambiguous result in parsing. Only reporting first one.'));
  }

  cliFormat(result0.output, formatter);

  const remained = countReflog(result0.rest);

  if (remained && option.verbose) {
    formatter.line(line => line.warnText(`Could not analyze last ${remained} (of ${numReflogs}) reflog items.`));
  }

  // logger.i("sorted operations", JSON.stringify(sortedOperations));
  return 0;
}
