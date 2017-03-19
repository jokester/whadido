/**
 * A lightweight git repo reader
 * not using node-bindings: they are too huge.
 */

export { findRepo, openRepo, GitRepo, ResolvedRef } from "./repo";
export { Ref, Obj, RefLog, Annotation, Human, Timestamp } from "./types";

import { PATTERNS } from "./parser";
export const detectRefpath = PATTERNS.refpath;
