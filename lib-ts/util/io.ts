import * as fs from "fs";
import * as path from "path";

import { Promisify } from "./transforms";
import * as $readdir from "recursive-readdir";

/**
 * read lines from a (UTF-8 text) file
 *
 * @param {string} filename
 * @returns {Promise<string[]>}
 */
export async function readLines(filename: string): Promise<string[]> {
    return (await readText(filename, { encoding: "utf-8" })).split("\n");
}

/**
 * recursively list all files under `dir`
 * @param dir path to start from
 */
export function recursiveReadDir(dir: string) {
    return new Promise<string[]>((fulfill, reject) => {
        $readdir(dir, (err, files) => {
            if (err)
                reject(err);
            else
                fulfill(files);
        });
    });
}

export function fromTest(...fragments: string[]) {
    return path.join(__dirname, "..", "..", "test", ...fragments);
}

export function fromTmp(...fragments: string[]) {
    return path.join(__dirname, "..", "..", "tmp", ...fragments);
}

export const readDir = Promisify.toPromise1(fs.readdir);
export const readFile = Promisify.toPromise1(fs.readFile);
export const readText = Promisify
    .toPromise2<string, { encoding: string; flag?: string; }, string>(fs.readFile);

export const lstat = Promisify.toPromise1(fs.lstat);
export const stat = Promisify.toPromise1(fs.stat);
export const unlink = Promisify.toPromise1v(fs.unlink);
export const mkdtemp = Promisify.toPromise1(fs.mkdtemp);
export const rmdir = Promisify.toPromise1v(fs.rmdir);
// NOTE 'rename' (and POSIX 'rename' syscall) is limited to same filesystem.
export const rename = Promisify.toPromise2v(fs.rename);

export const writeFile = Promisify.toPromise2v(fs.writeFile);