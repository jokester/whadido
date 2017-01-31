"use strict";
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const util_1 = require("../util");
function spawnChild(command, args, options) {
    args = args || [];
    return child_process_1.spawn(command, args, options);
}
exports.spawnChild = spawnChild;
/**
 *
 *
 * @export
 * @param {ChildProcess} child a *new* childprocess
 */
function waitChild(child) {
}
exports.waitChild = waitChild;
/**
 * A wrapper for node's subprocess
 *
 * provides error detection, etc
 *
 * (is this needed?)
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
function spawnSubprocess(command, args, options) {
    args = args || [];
    return new Promise((fulfill, reject) => {
        const subprocess = child_process_1.spawn(command, args, options);
        let stdout_lines = [];
        let stderr_lines = [];
        subprocess.on('error', reject);
        subprocess.stderr.on('data', (chunk) => {
            stderr_lines = stderr_lines.concat(util_1.chunkToLines(chunk));
        });
        subprocess.stdout.on('data', (chunk) => {
            stdout_lines = stdout_lines.concat(util_1.chunkToLines(chunk));
        });
        subprocess.on('exit', (code, signal) => {
            fulfill({
                stdout: stdout_lines,
                stderr: stderr_lines,
                exit: code,
                signal: signal,
            });
        });
    });
}
exports.spawnSubprocess = spawnSubprocess;
function rejectNonZeroReturn(result) {
    if (result.exit !== 0) {
        throw new Error(`subprocess returned non-zero: ${result.exit}`);
    }
    return result;
}
exports.rejectNonZeroReturn = rejectNonZeroReturn;
//# sourceMappingURL=subprocess.js.map