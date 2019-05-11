import * as path from 'path';
import { findRepo, openRepo } from './find-repo';
import { getSubprocessOutput } from '../vendor/ts-commonutil/node/subprocess';

describe('getSubprocessOutput', () => {
  it('captures exit value of process', async () => {
    const result1 = await getSubprocessOutput('true');
    expect(result1.stderr).toEqual(['']);

    const thrown = await getSubprocessOutput('false').then(() => false, () => true);

    expect(thrown).toBeTruthy();
  });

  it('captures stdout', async () => {
    const result = await getSubprocessOutput('/bin/echo', ['aa', 'bb']);
    expect(result.stdout).toEqual(['aa bb', '']);

    const result2 = await getSubprocessOutput('/bin/echo', ['-n', 'aa', 'bb']);
    expect(result2.stdout).toEqual(['aa bb']);
  });
});

describe('findRepo', () => {
  // a node-libtidy repo included for test
  const devRepoRoot = path.join(__dirname, '..', '..', 'test', 'node-libtidy.git');
  const devRepoStart = path.join(devRepoRoot, 'hooks');

  it('find root of repo', async () => {
    const repoRoot = await findRepo(devRepoStart);
    expect(repoRoot).toEqual(devRepoRoot);
  });

  it('opens repo', async () => {
    const repoRoot = await findRepo(devRepoStart);
    const repoReader = await openRepo(repoRoot!);
    expect(repoReader.repoRoot).toEqual(devRepoRoot);
  });
});
