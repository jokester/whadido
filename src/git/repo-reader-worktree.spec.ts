import path from 'path';
import { unTgz } from '../spec/helper';
import { findRepo } from './find-repo';

describe('git reader with support', () => {
  const testResourceRoot = path.join(__dirname, '..', '..', 'test');
  const dummyRepoTgzPath = path.join(testResourceRoot, 'dummy-repo.tgz');
  const dummyRepoBare = path.join(testResourceRoot, 'dummy-repo-bare.git');
  const dummyRepoWorktree1 = path.join(testResourceRoot, 'dummy-repo-worktree1');

  beforeAll(async done => {
    await unTgz(dummyRepoTgzPath, testResourceRoot);
    done();
  }, 2e3);

  it('finds orig git repo from worktree', async () => {
    const found = await findRepo(dummyRepoWorktree1);
    // expect(found).toEqual(dummyRepoBare);

    const found2 = await findRepo(found!);
    expect(found2).toEqual(dummyRepoBare);
  });
});
