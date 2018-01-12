"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mutex_1 = require("./mutex");
exports.MutexResource = mutex_1.MutexResource;
exports.MutexResourcePool = mutex_1.MutexResourcePool;
function deprecate() {
    throw new Error("Deprecated");
}
exports.deprecate = deprecate;
//# sourceMappingURL=index.js.map