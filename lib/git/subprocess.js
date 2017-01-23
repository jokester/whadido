"use strict";
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const util_1 = require("../util");
function swawnSubProc(command, args, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        args = args || [];
    });
}
exports.swawnSubProc = swawnSubProc;
class SubProc {
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