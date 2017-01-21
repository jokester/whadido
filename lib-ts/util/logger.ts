interface ILogger {
    e(arg1?: any, arg2?: any, ang3?: any): void
    w(arg1?: any, arg2?: any, ang3?: any): void
    i(arg1?: any, arg2?: any, ang3?: any): void
    v(arg1?: any, arg2?: any, ang3?: any): void
}

const minLogLevel = 1;

export const logger_normal: ILogger = {

    // e: ERROR (lvl=3)
    e: function () {
        if (minLogLevel > 3) return;
        const realArgs = ['ERROR'].concat(Array.from(arguments));
        console.error.apply(console, realArgs);
    },

    // w: WARNING (lvl=2)
    w: function () {
        if (minLogLevel > 2) return;
        const realArgs = ['WARN'].concat(Array.from(arguments));
        console.error.apply(console, realArgs);
    },

    // i: INFO (lvl=1)
    i: function () {
        if (minLogLevel > 1) return;
        const realArgs = ['INFO'].concat(Array.from(arguments));
        console.info.apply(console, realArgs);
    },

    // v: VERBOSE (lvl=0)
    v: function () {
        if (minLogLevel > 0) return;
        const realArgs = ['VERBOSE'].concat(Array.from(arguments));
        console.info.apply(console, realArgs);
    },
};

export const logger_silent: ILogger = {
    w(arg1?: any, arg2?: any, ang3?: any) { },
    i(arg1?: any, arg2?: any, ang3?: any) { },
    v(arg1?: any, arg2?: any, ang3?: any) { },
    e(arg1?: any, arg2?: any, ang3?: any) { },
}