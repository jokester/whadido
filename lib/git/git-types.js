"use strict";
var ObjType;
(function (ObjType) {
    ObjType[ObjType["COMMIT"] = "Commit"] = "COMMIT";
    ObjType[ObjType["ATAG"] = "Annotated tag"] = "ATAG";
    ObjType[ObjType["TREE"] = "Tree"] = "TREE";
    ObjType[ObjType["BLOB"] = "Blob"] = "BLOB";
})(ObjType = exports.ObjType || (exports.ObjType = {}));
var RefType;
(function (RefType) {
    RefType[RefType["TAG"] = "Tag"] = "TAG";
    RefType[RefType["BRANCH"] = "Branch"] = "BRANCH";
    RefType[RefType["HEAD"] = "HEAD"] = "HEAD";
})(RefType = exports.RefType || (exports.RefType = {}));
/**
 * GitTag: a plain tag
 */
class GitTag {
    constructor(name, dest) {
        this.type = RefType.TAG;
        this.name = name;
        this.dest = dest;
    }
}
exports.GitTag = GitTag;
/**
 * Annotated tag (`git tag -a`)
 * NOTE "dest" field of a annotated tag is actually an object for the object itself
 */
class GitAnnotatedTag extends GitTag {
    constructor(name, dest, annotation) {
        super(name, dest);
        this.annotation = annotation;
    }
}
exports.GitAnnotatedTag = GitAnnotatedTag;
/**
 * 'Branch' ref: points to a commit
 */
class GitBranch {
    constructor(dest) {
        this.type = RefType.BRANCH;
        this.dest = dest;
    }
}
exports.GitBranch = GitBranch;
/**
 * HEAD that points to a branch
 */
class GitHead {
    constructor(name, dest_name) {
        this.type = RefType.HEAD;
        this.name = name;
        this.dest = dest_name;
    }
}
exports.GitHead = GitHead;
/**
 * 'Bare' head: points to a commit instead of branch
 */
class GitBareHead {
    constructor(name, dest_commit) {
        this.type = RefType.HEAD;
        this.name = name;
        this.dest_commit = dest_commit;
    }
}
exports.GitBareHead = GitBareHead;
//# sourceMappingURL=git-types.js.map