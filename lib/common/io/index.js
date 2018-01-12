"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Read stream until end
 */
function readStream(stream) {
    return new Promise((resolve, reject) => {
        let buffers = [];
        stream.once("end", () => resolve(Buffer.concat(buffers)));
        stream.on("error", reject);
        stream.on("data", (chunk) => {
            if (Buffer.isBuffer(chunk))
                buffers.push(chunk);
            else if (typeof chunk === "string")
                buffers.push(Buffer.from(chunk));
            else {
                reject(new Error("data not recognized"));
            }
        });
    });
}
exports.readStream = readStream;
var fs_1 = require("./fs");
exports.FS = fs_1.FS;
const fs_2 = require("./fs");
var text_1 = require("./text");
exports.chunkToLines = text_1.chunkToLines;
exports.readLines = fs_2.FS.readLines;
//# sourceMappingURL=index.js.map