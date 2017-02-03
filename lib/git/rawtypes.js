"use strict";
/**
 * "raw" types that map to format of repository (which means references are not resolved)
 *
 * @copyright Wang Guan
 */
const util_1 = require("../util");
var ObjType;
(function (ObjType) {
    ObjType[ObjType["COMMIT"] = "Commit"] = "COMMIT";
    ObjType[ObjType["ATAG"] = "Annotated tag"] = "ATAG";
    ObjType[ObjType["TREE"] = "Tree"] = "TREE";
    ObjType[ObjType["BLOB"] = "Blob"] = "BLOB";
})(ObjType = exports.ObjType || (exports.ObjType = {}));
exports.DetectObjType = util_1.freeze({
    isCommit(obj) {
        return obj.type === ObjType.COMMIT;
    },
    isAnnotatedTag(obj) {
        return obj.type === ObjType.ATAG;
    }
});
/**
 * "Ref": points to another
 * NOTE (GitRef & Obje)
 */
var RefType;
(function (RefType) {
    // tags that are not resolved. A tag may point to a commit (normal for )
    RefType[RefType["UNKNOWN_TAG"] = "TAG OF UNKNOWN KIND"] = "UNKNOWN_TAG";
    RefType[RefType["ATAG"] = "Annotated tag"] = "ATAG";
    RefType[RefType["TAG"] = "Tag"] = "TAG";
    RefType[RefType["BRANCH"] = "Branch"] = "BRANCH";
    RefType[RefType["HEAD"] = "HEAD"] = "HEAD";
})(RefType = exports.RefType || (exports.RefType = {}));
//# sourceMappingURL=rawtypes.js.map