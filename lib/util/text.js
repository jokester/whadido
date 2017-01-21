"use strict";
const fs = require('fs');
function chunkToLines(chunk) {
    return chunk.toString().split(/\r\n|\r|\n/);
}
exports.chunkToLines = chunkToLines;
function readFile(filename) {
    return new Promise((resolve, reject) => {
        fs.readFile(filename, function (err, content) {
            if (err)
                reject(err);
            else
                resolve(content);
        });
    });
}
exports.readFile = readFile;
function readLines(filename) {
    return readFile(filename).then(chunkToLines);
}
exports.readLines = readLines;
//# sourceMappingURL=text.js.map