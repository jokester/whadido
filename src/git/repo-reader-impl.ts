import * as path from 'path';
import * as lodash from 'lodash';

import { Obj, Ref, RefLog } from './types';
import * as parser from './parser';
import { recursiveReadDir } from '../util';
import { GitRepoReader } from './repo-reader';
import { getLogger } from '../util/logging';
import { ObjReader } from './obj-reader';
import { fsp } from '../util/fsp';
import { chunkToLines } from '../vendor/ts-commonutil/text/chunk-to-lines';

const readLines = fsp.readLines;
const logger = getLogger(__filename, 'DEBUG');

export class GitRepoReaderImpl implements GitRepoReader {
  private allRefs!: Promise<Ref.Ref[]>;
  private readonly objReader: ObjReader;

  /**
   * @param repoRoot
   * @param gitBinary string name of git binary, can be just "git"
   */
  constructor(readonly repoRoot: string, readonly gitBinary = 'git') {
    this.objReader = new ObjReader(repoRoot, gitBinary);
  }

  /**
   * Free all resources
   */
  async dispose() {
    await this.objReader.dispose();
  }

  /**
   * @return all (top-level, unresolved) refs
   */
  async listRefs(): Promise<Ref.Ref[]> {
    if (!this.allRefs) {
      this.allRefs = this.fetchRefs();
    }
    return this.allRefs;
  }

  private async fetchRefs(): Promise<Ref.Ref[]> {
    const localHead = this.readLocalHead();
    const packed = this.readPackedRefs();
    const unpacked = this.readUnpackedRefs();
    // when a ref exists in both unpacked and packed, unpacked version takes precedence
    const allRefs: Ref.Ref[] = [];
    allRefs.push(await localHead);
    allRefs.push(...(await unpacked));
    allRefs.push(...(await packed));
    return lodash.uniqBy(allRefs, ref => ref.path);
  }

  /**
   * Local
   */
  async readLocalHead(): Promise<Ref.LocalHead> {
    const filename = path.join(this.repoRoot, 'HEAD');
    const lines = await readLines(filename);
    return parser.parseHEAD(lines[0]);
  }

  /**
   * Read packed refs
   */
  async readPackedRefs(): Promise<Ref.Ref[]> {
    const filename = path.join(this.repoRoot, 'packed-refs');
    try {
      const lines = await readLines(filename);
      return parser.parsePackedRefBlock(lines);
    } catch (e) {
      if (e.code === 'ENOENT') {
        return [];
      }
      throw e;
    }
  }

  async readRef(ref: Ref.Ref): Promise<Ref.Ref | Obj.Object> {
    if (ref.type === Ref.RefType.RemoteBranch || ref.type === Ref.RefType.LocalBranch) {
      return this.readCommit(ref.dest);
    }

    if (ref.type === Ref.RefType.LocalHead || ref.type === Ref.RefType.RemoteHead) {
      const refs = await this.listRefs();
      const matchedBranch = refs.find(r => r.path === ref.dest);
      if (matchedBranch) {
        return matchedBranch;
      }

      return this.readCommit(ref.dest);
    }

    if (ref.type === Ref.RefType.Tag) {
      return this.readObject(ref.dest); // commit or atag
    }

    // @ts-ignore
    throw new Error(`cannot resolve ref: ${ref.path} > ${ref.dest}`);
  }

  // head   > branch > commit
  // branch > commit
  // ref.tag > atag* > (non-atag) object
  async resolveRef(first: Ref.Ref): Promise<Ref.ResolvedRef> {
    if (first.type === Ref.RefType.Stash) return [first];
    const next = await this.readRef(first);

    if (
      [Ref.RefType.LocalBranch, Ref.RefType.RemoteBranch, Ref.RefType.LocalHead, Ref.RefType.RemoteHead].find(
        t => t === first.type,
      )
    ) {
      if (next.type === Obj.ObjType.Commit) {
        return [first, next];
      }

      if (Ref.isBranchRef(next)) {
        const ret = [first] as Ref.ResolvedRef;
        const rest = await this.resolveRef(next);
        ret.push(...rest);
        return ret;
      }
    }

    // first must be a tag if we get here
    if (Obj.isAnnotatedTag(next)) {
      const r: Ref.ResolvedRef = [first];
      for (let m: Obj.Object = next; Obj.isAnnotatedTag(m); ) {
        r.push(m);
        m = await this.readObject(m.dest);
      }
      return r;
    }

    return [first, next];
  }

  /**
   * Read non-packed refs
   */
  async readUnpackedRefs(): Promise<Ref.Ref[]> {
    const PATTERNS = parser.PATTERNS;
    const start = path.join(this.repoRoot, 'refs');
    const refFiles = await recursiveReadDir(start);
    const found = [] as Ref.Ref[];

    for (const f of refFiles) {
      // relative path like `refs/heads/...`
      const fRelative = path.relative(this.repoRoot, f);
      const lines = await readLines(f);

      if (PATTERNS.refpath.remoteHead.exec(fRelative)) {
        const p = parser.parseHEAD(lines[0], fRelative);
        found.push(p);
      } else if (PATTERNS.refpath.remoteBranch.exec(fRelative)) {
        const p = parser.parseBranch(lines[0], fRelative);
        found.push(p);
      } else if (PATTERNS.refpath.localBranch.exec(fRelative)) {
        const p = parser.parseBranch(lines[0], fRelative);
        found.push(p);
      } else if (PATTERNS.refpath.tag.exec(fRelative)) {
        const p = parser.parseTag(lines[0], fRelative);
        found.push(p);
      } else if (fRelative === 'refs/stash') {
        /* ignore stash TODO: should support stash in the future */
      } else {
        throw new Error(`failed to parse ref file: '${fRelative}'`);
      }
    }

    return found.sort(sortRefByPath);
  }

  /**
   * Read and parse git object
   * @param {string} sha1
   * @returns {Promise<GitObject>}
   */
  async readObject(sha1: string): Promise<Obj.Object> {
    const objRaw = await this.objReader.readObjRaw(sha1);
    switch (objRaw.type) {
      case Obj.ObjType.Commit:
        return parser.parseCommit(objRaw.sha1, chunkToLines(objRaw.data));
      case Obj.ObjType.ATag:
        return parser.parseAnnotatedTag(objRaw.sha1, chunkToLines(objRaw.data));
      case Obj.ObjType.Blob:
      case Obj.ObjType.Tree:
        return { sha1, type: objRaw.type };
    }
    throw new Error(`objType not recognized: ${objRaw.type}`);
  }

  /**
   * read reflog of a ref (branch or head)
   */
  async readReflog(refPath: string): Promise<RefLog[]> {
    const reflogPath = path.join(this.repoRoot, 'logs', refPath);
    try {
      const lines = await fsp.readLines(reflogPath);
      return lines.filter(line => !!line).map(parser.parseReflog);
    } catch (e) {
      return [];
    }
  }

  async readCommit(sha1: string): Promise<Obj.Commit> {
    const obj = await this.readObject(sha1);
    if (!Obj.isCommit(obj)) {
      throw new Error(`expected ${sha1} to be a commit. got ${obj.type}`);
    }
    return obj;
  }
}

function sortRefByPath(a: { path: string }, b: typeof a): number {
  return a.path > b.path ? 1 : a.path < b.path ? -1 : 0;
}

export class GitRepoReaderLogged extends GitRepoReaderImpl {
  static hr = '-------------------------------';

  async readRef(ref: Ref.Ref): Promise<Ref.Ref | Obj.Object> {
    logger.debug(GitRepoReaderLogged.hr);
    logger.debug('GitRepoReaderLogged#readRef <=', ref);
    const res = await super.readRef(ref);
    logger.debug('GitRepoReaderLogged#readRef =>', res);
    logger.debug(GitRepoReaderLogged.hr);
    return res;
  }
}
