"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// a reducer that concats
function concatReducer(prev, item, itemIndex, items) {
    return (prev || []).concat(item);
}
exports.concatReducer = concatReducer;
//# sourceMappingURL=util.js.map