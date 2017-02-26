"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * "raw" types that map to git protocol
 *
 * @copyright Wang Guan
 */
const util_1 = require("../util");
exports.DetectObjType = util_1.freeze({
    isCommit(obj) {
        return obj.type === 1 /* COMMIT */;
    },
    isAnnotatedTag(obj) {
        return obj.type === 2 /* ATAG */;
    }
});
/**
 * "Ref": git value that points to something else
 * NOTE: ref itself may or may not be a git object
 */
var RefType;
(function (RefType) {
    // tags that are not resolved. A tag may point to a commit (normal) or any object
    RefType[RefType["UNKNOWN_TAG"] = "TAG OF UNKNOWN KIND"] = "UNKNOWN_TAG";
    RefType[RefType["ATAG"] = "Annotated Tag"] = "ATAG";
    RefType[RefType["TAG"] = "Shallow Tag"] = "TAG";
    RefType[RefType["BRANCH"] = "Branch"] = "BRANCH";
    RefType[RefType["HEAD"] = "HEAD"] = "HEAD";
})(RefType = exports.RefType || (exports.RefType = {}));
//# sourceMappingURL=types.js.map