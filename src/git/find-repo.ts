import path from 'path';
import { GitRepoReaderImpl } from './repo-reader-impl';
import { GitRepoReader } from './repo-reader';
import { getSubprocessOutput } from '../vendor/ts-commonutil/node/subprocess';
import { fsp } from '../vendor/ts-commonutil/node';

/**
 * find git repo (bare or not) from directory `start`
 *
 * @export
 * @param {string} start the directory to start
 * @param {string} [gitBinary="git"] binary of git
 * @returns absolute path of the repo
 */
async function findRepoRaw(start: string, gitBinary = 'git'): Promise<string | null> {
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

export async function findRepo(start: string, gitBinary = 'git'): Promise<string | null> {
  const found1 = await findRepoRaw(start, gitBinary);
  if (!found1) return null;

  try {
    // if a 'commondir' file exists, find again in parent repo
    const lstat = await fsp.stat(path.join(found1, 'commondir'));
    return await findRepoRaw(path.join(found1, '..'), gitBinary);
  } catch (fNoEnt) {
    return found1;
  }
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
