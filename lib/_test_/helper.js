"use strict";
const fs = require('fs');
const path = require('path');
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
function genAbsPath(filename) {
    return path.join(__dirname, '..', '..', 'tmp', filename);
}
function logAsJSON(filename) {
    return writeLog(filename, prettyJson);
}
exports.logAsJSON = logAsJSON;
function writeLog(filename, transformer) {
    return (v) => writeFile(genAbsPath(filename), transformer(v));
}
exports.writeLog = writeLog;
function logError(filename) {
    const abspath = path.join(__dirname, '..', '..', 'tmp', filename);
    // after successful write, throw again
    return (err) => {
        const message = err.toString ? err.toString() : ('' + err);
        return writeFile(abspath, message).then(() => { throw err; });
    };
}
exports.logError = logError;
//# sourceMappingURL=helper.js.map