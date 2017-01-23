"use strict";
var ObjType;
(function (ObjType) {
    ObjType[ObjType["COMMIT"] = "Commit"] = "COMMIT";
    ObjType[ObjType["ATAG"] = "Annotated tag"] = "ATAG";
    ObjType[ObjType["TREE"] = "Tree"] = "TREE";
    ObjType[ObjType["BLOB"] = "Blob"] = "BLOB";
})(ObjType = exports.ObjType || (exports.ObjType = {}));
/**
 * "Ref": points to another
 * NOTE (GitRef & Obje)
 */
var RefType;
(function (RefType) {
    RefType[RefType["ATAG"] = "Annotated tag"] = "ATAG";
    RefType[RefType["TAG"] = "Tag"] = "TAG";
    RefType[RefType["BRANCH"] = "Branch"] = "BRANCH";
    RefType[RefType["HEAD"] = "HEAD"] = "HEAD";
})(RefType = exports.RefType || (exports.RefType = {}));
//# sourceMappingURL=rawtypes.js.map