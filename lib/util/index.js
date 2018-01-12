"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var io_1 = require("../common/io");
exports.chunkToLines = io_1.chunkToLines;
exports.readLines = io_1.readLines;
function isTr4uthy(v) {
    return !!v;
}
exports.isTr4uthy = isTr4uthy;
var type_1 = require("../common/type");
exports.deepFreeze = type_1.deepFreeze;
exports.freeze = type_1.freeze;
var mutex_1 = require("../common/util/mutex");
exports.MutexResource = mutex_1.MutexResource;
exports.MutexResourcePool = mutex_1.MutexResourcePool;
const $readdir = require("recursive-readdir");
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
//# sourceMappingURL=index.js.map