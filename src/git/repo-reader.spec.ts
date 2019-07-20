import * as path from 'path';

import { GitRepoReaderImpl } from './repo-reader-impl';
import { getLogger } from '../util/logging';
import { ObjReader } from './obj-reader';
import { Obj } from './types';
import { fsp } from "../vendor/ts-commonutil/node";

describe('git reader', () => {
  // a node-libtidy repo included for test
  const devRepoRoot = path.join(__dirname, '..', '..', 'test', 'node-libtidy.git');
  const logger = getLogger(__filename);

  let r: GitRepoReaderImpl;

  beforeEach(async () => {
    r = new GitRepoReaderImpl(devRepoRoot);
  });

  afterEach(async () => {
    await r.dispose();
  });

  it('reads packed refs', async () => {
    const packedRefs = await r.readPackedRefs();
    logger.debug('packedRefs', packedRefs);
    expect(packedRefs).toMatchSnapshot();
  });

  it('reads local HEAD', async () => {
    const localHead = await r.readLocalHead();
    expect(localHead).toMatchSnapshot();
  });

  it('reads unpacked refs', async () => {
    const unpackedRefs = await r.readUnpackedRefs();
    expect(unpackedRefs).toMatchSnapshot();
  });

  it('reads all refs', async () => {
    const refs = await r.listRefs();
    expect(refs).toMatchSnapshot();
  });

  it('reads object: commit', async () => {
    const o = await r.readObject('931bbc96');
    expect(o).toMatchSnapshot();
  });

  it('reads object: annotated tag', async () => {
    const o = await r.readObject('07fc');
    expect(o).toMatchSnapshot();
  });

  it('reads object: throws when sha1 not exist', async () => {
    try {
      await r.readObject('NOT');
      throw 'should not be here';
    } catch (e) {
      // expect(e).instanceOf(Error);
      expect(e.message).toEqual('object "NOT" is missing');
    }
  });

  it('reads reflog: HEAD', async () => {
    const reflog = await r.readReflog('HEAD');
    expect(reflog).toMatchSnapshot();
  });

  it('reads reflog: non-exist', async () => {
    const reflog = await r.readReflog('empty');
    expect(reflog.length).toEqual(0);
  });

  it('can read all objects', async () => {
    const objectListFile = path.join(r.repoRoot, 'objects-list.txt');
    const objectList = await fsp.readLines(objectListFile);
    for (const l of objectList) {
      const sha1 = l.slice(0, 40);
      if (sha1) {
        const obj = await r.readObject(sha1);
      }
    }
  });

  it('reads correct obj content', async () => {
    const objReader: ObjReader = (r as any).objReader;
    // "parse-version.js" file in tag v0.3.0
    const rawObject = await objReader.readObjRaw('8394bc317ead9424e58c860ae521b41ed1b1697c');
    expect(rawObject.type).toBe(Obj.ObjType.Blob);

    const fileContent = rawObject.data.toString('utf-8');
    expect(fileContent.length).toBe(387);
    expect(fileContent.startsWith('"use strict')).toBe(true);
    expect(fileContent.endsWith('}\n')).toBe(true);
  });

  it('reads all ref', async () => {
    for (const ref of await r.listRefs()) {
      const next = await r.readRef(ref);
      const resolved = await r.resolveRef(ref);

      expect(next).toMatchSnapshot(`next(${ref.path})`);
      expect(resolved).toMatchSnapshot(`resolved(${ref.path})`);
    }
  });
});
