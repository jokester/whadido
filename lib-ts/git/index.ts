/**
 * A lightweight git repo reader
 * not using node-bindings: they are too huge and inconvient w/ electron
 */

export { findRepo, openRepo, GitRepo } from './repo'