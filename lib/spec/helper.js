"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
/**
 *
 *
 * @param {string} absPath
 * @param {string} content
 * @returns {Promise<void>}
 */
function writeFile(absPath, content) {
    return new Promise(function (fulfill, reject) {
        fs.writeFile(absPath, content, function (err) {
            if (err) {
                reject(err);
            }
            else
                fulfill();
        });
    });
}
function prettyJson(val) {
    return JSON.stringify(val, null, 4);
}
function genTmpPath(filename) {
    return path.join(__dirname, "..", "..", "tmp", filename);
}
exports.fromTmp = genTmpPath;
function genTestPath(filename) {
    return path.join(__dirname, "..", "..", "test", filename);
}
exports.genTestPath = genTestPath;
exports.fromTest = genTestPath;
function logAsJSON(filename) {
    return writeLog(filename, prettyJson);
}
exports.logAsJSON = logAsJSON;
function writeLog(filename, transformer) {
    return (v) => writeFile(genTmpPath(filename), transformer(v));
}
exports.writeLog = writeLog;
function logError(filename) {
    const abspath = path.join(__dirname, "..", "..", "tmp", filename);
    // after successful write, throw again
    return (err) => {
        const message = err.toString ? err.toString() : ("" + err);
        return writeFile(abspath, message).then(() => { throw err; });
    };
}
exports.logError = logError;
function getMatchedIndex(pattern, against) {
    const matched = [];
    // return against.filter(s => s.match(pattern)).map(toIndex);
    against.forEach((v, lineNo) => {
        if (v.match(pattern)) {
            matched.push(lineNo);
        }
    });
    return matched;
}
exports.getMatchedIndex = getMatchedIndex;
function countEq(array, value) {
    return array.filter(v => v === value).length;
}
exports.countEq = countEq;
//# sourceMappingURL=helper.js.map