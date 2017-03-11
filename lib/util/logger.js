"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const minLogLevel = 1;
exports.logger_normal = {
    // e: ERROR (lvl=3)
    e: function () {
        if (minLogLevel > 3)
            return;
        const realArgs = ["ERROR"].concat(Array.from(arguments));
        console.error.apply(console, realArgs);
    },
    // w: WARNING (lvl=2)
    w: function () {
        if (minLogLevel > 2)
            return;
        const realArgs = ["WARN"].concat(Array.from(arguments));
        console.error.apply(console, realArgs);
    },
    // i: INFO (lvl=1)
    i: function () {
        if (minLogLevel > 1)
            return;
        const realArgs = ["INFO"].concat(Array.from(arguments));
        console.info.apply(console, realArgs);
    },
    // v: VERBOSE (lvl=0)
    v: function () {
        if (minLogLevel > 0)
            return;
        const realArgs = ["VERBOSE"].concat(Array.from(arguments));
        console.info.apply(console, realArgs);
    },
};
exports.logger_silent = {
    w(arg1, arg2, ang3) { },
    i(arg1, arg2, ang3) { },
    v(arg1, arg2, ang3) { },
    e(arg1, arg2, ang3) { },
};
//# sourceMappingURL=logger.js.map