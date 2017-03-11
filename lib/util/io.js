"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs = require("fs");
const transforms_1 = require("./transforms");
const $readdir = require("recursive-readdir");
/**
 * read lines from a (UTF-8 text) file
 *
 * @param {string} filename
 * @returns {Promise<string[]>}
 */
function readLines(filename) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return (yield exports.readText(filename, { encoding: "utf-8" })).split("\n");
    });
}
exports.readLines = readLines;
/**
 * recursively list all files under `dir`
 * @param dir path to start from
 */
function recursiveReadDir(dir) {
    return new Promise((fulfill, reject) => {
        $readdir(dir, (err, files) => {
            if (err)
                reject(err);
            else
                fulfill(files);
        });
    });
}
exports.recursiveReadDir = recursiveReadDir;
exports.readDir = transforms_1.Promisify.toPromise1(fs.readdir);
exports.readFile = transforms_1.Promisify.toPromise1(fs.readFile);
exports.readText = transforms_1.Promisify
    .toPromise2(fs.readFile);
exports.lstat = transforms_1.Promisify.toPromise1(fs.lstat);
exports.stat = transforms_1.Promisify.toPromise1(fs.stat);
exports.unlink = transforms_1.Promisify.toPromise1v(fs.unlink);
exports.mkdtemp = transforms_1.Promisify.toPromise1(fs.mkdtemp);
exports.rmdir = transforms_1.Promisify.toPromise1v(fs.rmdir);
// NOTE 'rename' (and POSIX 'rename' syscall) is limited to same filesystem.
exports.rename = transforms_1.Promisify.toPromise2v(fs.rename);
exports.writeFile = transforms_1.Promisify.toPromise2v(fs.writeFile);
//# sourceMappingURL=io.js.map