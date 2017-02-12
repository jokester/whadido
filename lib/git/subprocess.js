"use strict";
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const util_1 = require("../util");
/**
 * A wrapper for node's subprocess
 *
 * provides error detection, etc
 *
 * (FIXME: is this ever needed?)
 */
class SubProc {
    constructor(proc) {
        this.proc = proc;
        this.finished = new Promise((fulfill, reject) => {
        });
    }
    static spawn(cmd, args, options) {
        const proc = child_process_1.spawn(cmd, args, options);
        return new this(proc);
    }
    wait() {
        if (!this.result)
            this.result = this.doWait();
        return this.result;
    }
    doWait() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // TODO
            return null;
        });
    }
}
/**
 * spawn a subprocess and capture its stdout/stderr/return value
 *
 * rejects if the subprocess could not be spawned
 *
 * TODO change this to a process class
 */
function getSubprocessOutput(command, args, options) {
    args = args || [];
    return new Promise((fulfill, reject) => {
        child_process_1.execFile(command, args, options, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            }
            else {
                fulfill({
                    stdout: util_1.chunkToLines(stdout),
                    stderr: util_1.chunkToLines(stderr),
                });
            }
        });
    });
}
exports.getSubprocessOutput = getSubprocessOutput;
function rejectNonZeroReturn(result) {
    if (result.exit !== 0) {
        throw new Error(`subprocess returned non-zero: ${result.exit}`);
    }
    return result;
}
exports.rejectNonZeroReturn = rejectNonZeroReturn;
//# sourceMappingURL=subprocess.js.map