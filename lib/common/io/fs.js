"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs = require("fs");
const path = require("path");
const promisify_1 = require("../type/promisify");
const text_1 = require("./text");
/**
 * FS: node's builtin as module
 */
var FSImpl;
(function (FSImpl) {
    function cp(oldPath, newPath) {
        return new Promise((fulfill, reject) => {
            const readStream = fs.createReadStream(oldPath);
            const writeStream = fs.createWriteStream(newPath);
            readStream.on("error", reject);
            writeStream.on("error", reject);
            readStream.on("close", fulfill);
            readStream.pipe(writeStream);
        });
    }
    FSImpl.cp = cp;
    /**
     * mv: use POSIX rename first, and fallback to (cp + unlink)
     *
     * @export
     * @param {string} oldPath
     * @param {string} newPath
     */
    function mv(oldPath, newPath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                yield FSImpl.rename(oldPath, newPath);
            }
            catch (e) {
                if (e && e.code === "EXDEV") {
                    /**
                     * on "EXDEV: cross-device link not permitted" error
                     * fallback to cp + unlink
                     */
                    yield cp(oldPath, newPath);
                    yield FSImpl.unlink(oldPath);
                }
                else {
                    throw e;
                }
            }
        });
    }
    FSImpl.mv = mv;
    FSImpl.readDir = promisify_1.toPromise1(fs.readdir);
    FSImpl.readFile = promisify_1.toPromise1(fs.readFile);
    FSImpl.readText = promisify_1.toPromise2(fs.readFile);
    FSImpl.lstat = promisify_1.toPromise1(fs.lstat);
    FSImpl.stat = promisify_1.toPromise1(fs.stat);
    FSImpl.unlink = promisify_1.toPromise1(fs.unlink);
    FSImpl.mkdtemp = promisify_1.toPromise1(fs.mkdtemp);
    FSImpl.rmdir = promisify_1.toPromise1(fs.rmdir);
    // NOTE 'rename' (and POSIX 'rename' syscall) is limited to same filesystem.
    FSImpl.rename = promisify_1.toPromise2(fs.rename);
    FSImpl.writeFile = promisify_1.toPromise2(fs.writeFile);
    /**
     * read lines from a (UTF-8 text) file
     *
     * @param {string} filename
     * @returns {Promise<string[]>}
     */
    function readLines(filename) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return text_1.chunkToLines(yield FSImpl.readText(filename, { encoding: "utf-8" }));
        });
    }
    FSImpl.readLines = readLines;
    /**
     * @export
     * @param {string} dirName
     * @returns {Promise<DirItem[]>} (name + isDir + size) of entries
     */
    function readDirDetail(dirName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const s = yield FSImpl.stat(dirName);
            if (!s.isDirectory()) {
                throw new Error(`expected a directory at '${dirName}'`);
            }
            const childNames = yield FSImpl.readDir(dirName);
            const children = childNames.map((name) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                const fullPath = path.join(dirName, name);
                const childS = yield FSImpl.stat(fullPath);
                const childItem = {
                    name: name,
                    isDir: childS.isDirectory(),
                    // -1 works better with JSON
                    // NaN will be serialized to `null`
                    size: childS.isDirectory() ? -1 : childS.size
                };
                return childItem;
            }));
            return Promise.all(children);
        });
    }
    FSImpl.readDirDetail = readDirDetail;
})(FSImpl || (FSImpl = {}));
exports.FS = FSImpl;
//# sourceMappingURL=fs.js.map