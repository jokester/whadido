import fs from 'fs';
import util from 'util';
import { chunkToLines } from '../vendor/ts-commonutil/text/chunk-to-lines';

/** TODO: move to ts-commonutil */
export namespace fsp {
  export const readDir = util.promisify(fs.readdir);
  export const readFile = util.promisify(fs.readFile);

  export const readText = (filename: string, encoding: string = 'UTF-8') => readFile(filename, { encoding });

  export const readLines = (filename: string) => readText(filename).then(chunkToLines);

  export const lstat = util.promisify(fs.lstat);

  export const stat = util.promisify(fs.stat);

  export const unlink = util.promisify(fs.unlink);

  export const mkdtemp = util.promisify(fs.mkdtemp);

  export const rmdir = util.promisify(fs.rmdir);

  export const rename = util.promisify(fs.rename);

  export const writeFile = util.promisify(fs.writeFile);

  export const cp = util.promisify(fs.copyFile);

  export const mv = async (oldPath: string, newPath: string) => {
    try {
      return await rename(oldPath, newPath);
    } catch (e) {
      if (e && e.code === 'EXDEV') {
        /**
         * on "EXDEV: cross-device link not permitted" error
         * fallback to cp + unlink
         */
        await cp(oldPath, newPath);
        return await unlink(oldPath);
      } else {
        throw e;
      }
    }
  };
}
