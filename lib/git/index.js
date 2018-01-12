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
const type_1 = require("../common/type");
const parser_1 = require("./parser");
const _git_parser = require("./parser");
exports.git_parser = _git_parser;
exports.detectRefpath = parser_1.PATTERNS.refpath;
exports.CONST = type_1.freeze({
    HEAD: "HEAD",
    EMPTY_OBJ: "0000000000000000000000000000000000000000",
});
//# sourceMappingURL=index.js.map