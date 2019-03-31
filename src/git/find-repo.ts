import { GitRepoException } from '../error';
import { GitRepoReaderImpl } from './repo-reader-impl';
import { GitRepoReader } from './repo-reader';
import { getSubprocessOutput } from '../vendor/ts-commonutil/node/subprocess';

/**
 * find git repo (bare or not) from directory `start`
 *
 * @export
 * @param {string} start the directory to start
 * @param {string} [gitBinary="git"] binary of git
 * @returns absolute path of the repo
 */
export async function findRepo(start: string, gitBinary = 'git') {
  // `git rev-parse --git-dir` prints path of $PWD
  const status = await getSubprocessOutput(gitBinary, ['rev-parse', '--absolute-git-dir'], { cwd: start });

  // find first absolute path
  for (const l of status.stdout) {
    if (l.match(/^\//)) {
      return l;
    }
  }

  throw new GitRepoException(
    `findRepo(): cannot find git repo for ${start}. got ${JSON.stringify(status)} from 'git rev-parse'`,
  );
}

/**
 * open git repo
 *
 * @export
 * @param {string} start absolute path of root, returned by `findRepo`
 * @param {string} [gitBinary="git"]
 * @returns {Promise<GitRepoReader>}
 */
export async function openRepo(start: string, gitBinary = 'git'): Promise<GitRepoReader> {
  const repoRoot = await findRepo(start, gitBinary);
  return new GitRepoReaderImpl(repoRoot, gitBinary);
}
