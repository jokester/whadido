import { GitRepoException } from './error';
import { GitRepoReaderImpl } from './repo-reader-impl';
import { GitRepoReader } from './repo-reader';
import { getSubprocessOutput } from "../vendor/ts-commonutil/node/subprocess";

/**
 * find git repo (bare or not) from directory `start`
 *
 * @export
 * @param {string} start the directory to start
 * @param {string} [gitBinary="git"] binary of git
 * @returns absolute path of the repo
 */
export async function findRepo(start: string, gitBinary = 'git'): Promise<string | null> {
  const status = await getSubprocessOutput(
    gitBinary,
    ['rev-parse', /* requires git 2.3 */ '--absolute-git-dir', '--git-dir'],
    { cwd: start },
  );

  // find first absolute path
  for (const l of status.stdout) {
    if (l.match(/^\//)) {
      return l;
    }
  }

  return null;
}

/**
 * open git repo
 *
 * @export
 * @param {string} start absolute path of root, returned by `findRepo`
 * @param {string} [gitBinary="git"]
 * @returns {Promise<GitRepoReader>}
 */
export async function openRepo(repoRoot: string, gitBinary = 'git'): Promise<GitRepoReader> {
  return new GitRepoReaderImpl(repoRoot, gitBinary);
}
