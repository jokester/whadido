"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Cast a value to its DeepReadonly<T> type
 *
 * @export
 * @template T
 * @param {T} arg
 * @returns
 */
function deepFreeze(arg) {
    return arg;
}
exports.deepFreeze = deepFreeze;
function freeze(arg) {
    return arg;
}
exports.freeze = freeze;
//# sourceMappingURL=freeze.js.map