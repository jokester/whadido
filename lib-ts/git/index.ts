/**
 * A lightweight git repo reader
 * not using node-bindings: they are too huge.
 */

export { findRepo, openRepo, GitRepo, ResolvedRef } from "./repo";
export { Ref, Obj, RefLog, Annotation, Human, Timestamp } from "./types";

import { freeze } from "../common/type";

import { PATTERNS } from "./parser";
import * as _git_parser from "./parser";
export const git_parser = _git_parser;

export const detectRefpath = PATTERNS.refpath;

export const CONST = freeze({
    HEAD: "HEAD",
    EMPTY_OBJ: "0000000000000000000000000000000000000000",
});
