"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Obj;
(function (Obj) {
    function isCommit(obj) {
        return obj.type === 1 /* COMMIT */;
    }
    Obj.isCommit = isCommit;
    function isAnnotatedTag(obj) {
        return obj.type === 2 /* ATAG */;
    }
    Obj.isAnnotatedTag = isAnnotatedTag;
})(Obj = exports.Obj || (exports.Obj = {}));
var Ref;
(function (Ref) {
    /**
     * "Ref": git value that points to something else
     * NOTE: ref itself may or may not be a git object
     */
    var Type;
    (function (Type) {
        // tags that are not resolved. A tag may point to a commit (normal) or any object
        Type[Type["UNKNOWN_TAG"] = "TAG OF UNKNOWN KIND"] = "UNKNOWN_TAG";
        Type[Type["ATAG"] = "Annotated Tag"] = "ATAG";
        Type[Type["TAG"] = "Shallow Tag"] = "TAG";
        Type[Type["BRANCH"] = "Branch"] = "BRANCH";
        Type[Type["HEAD"] = "HEAD"] = "HEAD";
    })(Type = Ref.Type || (Ref.Type = {}));
})(Ref = exports.Ref || (exports.Ref = {}));
//# sourceMappingURL=types.js.map