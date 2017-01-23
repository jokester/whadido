"use strict";
var text_1 = require("./text");
exports.chunkToLines = text_1.chunkToLines;
exports.readFile = text_1.readFile;
exports.readLines = text_1.readLines;
var logger_1 = require("./logger");
exports.logger_normal = logger_1.logger_normal;
exports.logger_silent = logger_1.logger_silent;
var transforms_1 = require("./transforms");
exports.liftA2 = transforms_1.liftA2;
function isTruthy(v) {
    return !!v;
}
exports.isTruthy = isTruthy;
var type_1 = require("./type");
exports.deepFreeze = type_1.deepFreeze;
exports.freeze = type_1.freeze;
//# sourceMappingURL=index.js.map