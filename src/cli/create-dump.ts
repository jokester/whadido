import { readRefHistory, RefHistory } from '../analyze/ref-state';
import { ParsedOptions } from './options';
import { GitRepoReader } from '../git/repo-reader';
import * as path from 'path';
import { fsp } from '../util/fsp';

export async function createDump(options: ParsedOptions, repo: GitRepoReader) {
  const input = await readRefHistory(repo);

  const dumpJSON = JSON.stringify(input, undefined, 4);

  const now = new Date();

  const timeSegments = [now.getTime()];

  const dumpFilename = path.join(process.cwd(), `whadido-dump-${timeSegments.join('-')}.json`);

  try {
    await fsp.writeFile(dumpFilename, dumpJSON);
    console.info(`dumped reflogs to ${dumpFilename}`);
  } catch (e) {
    console.error(`error dumping reflogs to ${dumpFilename}`);
    throw e;
  }
}
