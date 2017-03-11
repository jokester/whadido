import { spawn, exec, execFile, SpawnOptions, ChildProcess } from "child_process";
import { chunkToLines } from "../util";

/**
 * Captured output of subprocess
 */
interface SubprocessOutput {
    stderr: string[];
    stdout: string[];
}

/**
 * Result after subprocess finished
 */
interface SubprocessResult$ {
    stderr: string[];
    stdout: string[];
    exit: number;
    signal: string;
}

/**
 * A wrapper for node's subprocess
 *
 * provides error detection, etc
 *
 * (FIXME: is this ever needed?)
 */
class SubProc {

    static spawn(cmd: string, args: string[], options: SpawnOptions): SubProc {
        const proc = spawn(cmd, args, options);
        return new this(proc);
    }

    // finished: resolve with return value
    // failed to spawn: reject
    private finished: Promise<number>;

    constructor(private readonly proc: ChildProcess) {
        this.finished = new Promise<number>((fulfill, reject) => {

        });
    }

    private result: Promise<SubprocessResult$>;


    wait() {
        if (!this.result)
            this.result = this.doWait();
        return this.result;
    }

    async doWait(): Promise<null> {
        // TODO
        return null;
    }
}

/**
 * spawn a subprocess and capture its stdout/stderr/return value
 *
 * rejects if the subprocess could not be spawned
 *
 * TODO change this to a process class
 */
export function getSubprocessOutput(command: string,
    args?: string[],
    options?: SpawnOptions) {

    args = args || [];

    return new Promise<SubprocessOutput>((fulfill, reject) => {
        execFile(command, args, options, (err: Error, stdout: string, stderr: string) => {
            if (err) {
                reject(err);
            } else {
                fulfill({
                    stdout: chunkToLines(stdout),
                    stderr: chunkToLines(stderr),
                });
            }
        });
    });
}

export function rejectNonZeroReturn(result: SubprocessResult$) {
    if (result.exit !== 0) {
        throw new Error(`subprocess returned non-zero: ${result.exit}`);
    }
    return result;
}