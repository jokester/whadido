import rReaddir from 'recursive-readdir';

/**
 * recursively list all files under `dir`
 * @param dir path to start from
 */
export function recursiveReadDir(dir: string) {
  return new Promise<string[]>((fulfill, reject) => {
    rReaddir(dir, (err, files) => {
      if (err) {
        reject(err);
      } else {
        fulfill(files);
      }
    });
  });
}
