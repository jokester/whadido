"use strict";
/**
 * A lightweight git repo reader
 * not using node-bindings: they are too huge.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var repo_1 = require("./repo");
exports.findRepo = repo_1.findRepo;
exports.openRepo = repo_1.openRepo;
var types_1 = require("./types");
exports.Ref = types_1.Ref;
exports.Obj = types_1.Obj;
const util_1 = require("../util");
const parser_1 = require("./parser");
exports.detectRefpath = parser_1.PATTERNS.refpath;
exports.CONST = util_1.freeze({
    HEAD: "HEAD",
    EMPTY_OBJ: "0000000000000000000000000000000000000000",
});
//# sourceMappingURL=index.js.map