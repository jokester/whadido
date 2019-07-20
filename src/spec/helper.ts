import path from 'path';
import { writeFile } from '../vendor/ts-commonutil/node/fsp';

function prettyJson(val: any) {
  return JSON.stringify(val, null, 4);
}

function genTmpPath(filename: string) {
  return path.join(__dirname, '..', '..', 'tmp', filename);
}

export const fromTmp = genTmpPath;

export function genTestPath(filename: string) {
  return path.join(__dirname, '..', '..', 'test', filename);
}

export const fromTest = genTestPath;

export function logAsJSON(filename: string): (v: any) => Promise<void> {
  return writeLog(filename, prettyJson);
}

export function writeLog(filename: string, transformer: (val: any) => string) {
  return (v: string | Buffer) => writeFile(genTmpPath(filename), transformer(v));
}

export function logError(filename: string) {
  const abspath = path.join(__dirname, '..', '..', 'tmp', filename);
  // after successful write, throw again
  return (err: any) => {
    const message = err.toString ? err.toString() : '' + err;
    return writeFile(abspath, message).then(() => {
      throw err;
    });
  };
}

export function getMatchedIndex(pattern: RegExp, against: string[]): number[] {
  const matched: number[] = [];
  // return against.filter(s => s.match(pattern)).map(toIndex);
  against.forEach((v, lineNo) => {
    if (v.match(pattern)) {
      matched.push(lineNo);
    }
  });
  return matched;
}

export function countEq<T>(array: T[], value: T): number {
  return array.filter(v => v === value).length;
}
