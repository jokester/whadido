import { Human, Obj, Timestamp } from '../git';
import * as path from 'path';
import { getLogger } from '../util/logging';
import { GitRepoReaderLogged } from '../git/repo-reader-impl';
import { ChalkFormatter, ChalkLineFormatter } from '../formatter/chalk-formatter';
import { findRepo } from '../git/find-repo';

const logger = getLogger(__filename, 'DEBUG');

async function debugMain() {
  const start = path.join(__dirname, '..', 'test', 'node-libtidy.git');
  const repo = await findRepo(start);
  const reader = new GitRepoReaderLogged(repo!);

  const refs = await reader.listRefs();
  logger.debug('listRefs', refs);
  for (const h of refs) {
    const resolved = await reader.resolveRef(h);
  }

  await reader.dispose();
}

namespace DummyData {
  export const dummyHuman: Human = {
    name: 'dummyHuman',
    email: 'human@example.com',
  };

  export const dummyTimestamp: Timestamp = {
    tz: '+0500',
    utcSec: 0,
  };

  export const dummyCommit: Obj.Commit = {
    type: Obj.ObjType.Commit,
    author: dummyHuman,
    authorAt: dummyTimestamp,
    commitAt: dummyTimestamp,
    committer: dummyHuman,
    message: ['msg'],
    sha1: '12345678abcdef',
    parentSHA1: [],
  };
}

function tryFormatter() {
  const formatter = new ChalkLineFormatter({
    printLn: (...s) => console.log(...s),
    gitSha1Length: 8,
  });

  formatter
    .commit(DummyData.dummyCommit)
    .text('w1 w3   w4')
    .date(new Date())
    .timestamp(DummyData.dummyCommit.commitAt)
    .end();
}

/**
 * Run this file with node / ts-node to test output of parser
 */
if (require.main === module) {
  tryFormatter();
}
