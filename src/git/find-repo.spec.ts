import * as path from 'path';
import { findRepo, openRepo } from './find-repo';
import { getSubprocessOutput } from '../vendor/ts-commonutil/node/subprocess';

describe('getSubprocessOutput', () => {
  it('captures exit value of process', async () => {
    const result1 = await getSubprocessOutput('true');
    expect(result1.stderr).toEqual(['']);

    let err: any;
    try {
      await getSubprocessOutput('false');
    } catch (e) {
      err = e;
    }

    expect(err).toBeTruthy();
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
    const f = await findRepo(devRepoStart);
    expect(f).toEqual(devRepoRoot);
  });

  it('opens repo', async () => {
    const r = await openRepo(devRepoStart);
    expect(r.repoRoot).toEqual(devRepoRoot);
  });
});
