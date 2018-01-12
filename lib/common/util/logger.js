"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 * @param verbosity
 */
function createLogger(verbosity) {
    return {
        setVerbosity(v) {
            verbosity = v;
        },
        // lvl3
        debug(...param) {
            if (verbosity >= 3) {
                (console.debug || console.info).call(console, "DEBUG", ...param);
            }
        },
        // lvl2
        info(...param) {
            if (verbosity >= 2) {
                console.info.call(console, "INFO", ...param);
            }
        },
        // lvl1
        warn(...param) {
            if (verbosity >= 1) {
                console.warn.call(console, "WARN", ...param);
            }
        },
        // lvl0
        error(...param) {
            if (verbosity >= 0) {
                console.error.call(console, "ERROR", ...param);
            }
        },
        // always
        fatal(...param) {
            console.error.call(console, "FATAL", ...param);
        }
    };
}
exports.createLogger = createLogger;
var Logger;
(function (Logger) {
    Logger.debug = createLogger(3);
    Logger.normal = createLogger(2);
    Logger.quiet = createLogger(1);
    Logger.silent = createLogger(0);
})(Logger = exports.Logger || (exports.Logger = {}));
//# sourceMappingURL=logger.js.map