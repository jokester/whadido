import path from 'path';
import { unTgz } from '../spec/helper';
import { findRepo } from './find-repo';

describe('git reader with support', () => {
  const testResourceRoot = path.join(__dirname, '..', '..', 'test');
  const dummyRepoTgzPath = path.join(testResourceRoot, 'dummy-repo.tgz');
  const dummyRepoBare = path.join(testResourceRoot, 'dummy-repo-bare.git');
  const dummyRepoWorktree2 = path.join(testResourceRoot, 'dummy-repo-worktree2');

  beforeAll(async done => {
    await unTgz(dummyRepoTgzPath, testResourceRoot);
    done();
  }, 2e3);

  it('finds the bare repo itself', async () => {
    const found = await findRepo(path.join(dummyRepoBare, 'objects/pack'));
    expect(found).toEqual(dummyRepoBare);
  });

  it('finds orig git repo from worktree', async () => {
    const found = await findRepo(dummyRepoWorktree2);
    expect(found).toEqual(dummyRepoBare);
  });
});
