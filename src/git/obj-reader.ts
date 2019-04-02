import { ResourcePool } from '../vendor/ts-commonutil/concurrency/resource-pool';
import { ChildProcess, spawn } from 'child_process';
import { Obj } from './types';
import { ObjBuilder } from './obj-builder';

export class ObjReader {
  private readonly catRawObj: ResourcePool<ChildProcess>;

  /**
   * @param repoRoot
   * @param gitBinary string name of git binary, can be just "git"
   */
  constructor(readonly repoRoot: string, readonly gitBinary = 'git') {
    // use 1 process
    // FIXME we may be able to replace this with a adaptive subprocess pool?
    this.catRawObj = ResourcePool.from1(spawn(this.gitBinary, ['cat-file', '--batch'], { cwd: this.repoRoot }));
  }

  async dispose() {
    await this.catRawObj.queue(async proc => {
      proc.kill();
    });
  }

  async readObjRaw(sha1: string): Promise<Obj.ObjectData> {
    const objReader = new ObjBuilder(sha1);

    return this.catRawObj.queue(async child => {
      try {
        await new Promise<void>((fulfill, reject) => {
          child.stdout.on('data', (chunk: Buffer) => {
            try {
              const finished = objReader.feed(chunk);
              if (finished) {
                fulfill();
              }
            } catch (e) {
              reject(e);
            }
          });

          child.stdin.write(`${sha1}\n`, (err: unknown) => {
            if (err) {
              reject(err);
            }
          });
        });
        return objReader.getObj();
      } finally {
        child.stdout.removeAllListeners('data');
      }
    });
  }
}
