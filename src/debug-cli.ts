import { findRepo, openRepo } from './git';
import * as path from 'path';
import { getLogger } from './util/logging';
import { GitRepoReaderImpl, GitRepoReaderLogged } from './git/repo-reader-impl';

const logger = getLogger(__filename, 'DEBUG');
debugMain().catch((e: any) => {
  console.error('something went wrong:', e);
  setTimeout(() => process.exit(2), 1e3);
});

async function debugMain() {
  const start = path.join(__dirname, '..', 'test', 'node-libtidy.git');
  const repo = await findRepo(start);
  const reader = new GitRepoReaderLogged(repo);

  const refs = await reader.listRefs();
  logger.debug('listRefs', refs);

  for (const h of refs) {
    const resolved = await reader.resolveRef(h);
  }

  await reader.dispose();
}
