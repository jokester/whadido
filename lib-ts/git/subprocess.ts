import { spawn, SpawnOptions, ChildProcess } from 'child_process';
import { chunkToLines } from '../util';

/**
 *
 */

/**
 * Result after subprocess finished
 */
interface SubprocessResult {
    stderr: string[]
    stdout: string[]
    exit: number
    signal: string
}

export function spawnChild(command: string,
    args?: string[],
    options?: SpawnOptions) {

    args = args || [];

    return spawn(command, args, options);
}


/**
 * 
 * 
 * @export
 * @param {ChildProcess} child a *new* childprocess
 */
export function waitChild(child: ChildProcess) {
}

/**
 * A wrapper for node's subprocess
 * 
 * provides error detection, etc
 * 
 * (is this needed?)
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

        })
    }

    private result: Promise<SubprocessResult>;


    wait() {
        if (!this.result)
            this.result = this.doWait();
        return this.result;
    }

    async doWait() {
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
export function spawnSubprocess(command: string,
    args?: string[],
    options?: SpawnOptions) {

    args = args || [];

    return new Promise<SubprocessResult>((fulfill, reject) => {
        const subprocess = spawn(command, args, options);

        let stdout_lines = [] as string[];
        let stderr_lines = [] as string[];

        subprocess.on('error', reject);

        subprocess.stderr.on('data', (chunk) => {
            stderr_lines = stderr_lines.concat(chunkToLines(chunk));
        });

        subprocess.stdout.on('data', (chunk) => {
            stdout_lines = stdout_lines.concat(chunkToLines(chunk));
        });

        subprocess.on('exit', (code, signal) => {
            fulfill({
                stdout: stdout_lines,
                stderr: stderr_lines,
                exit: code,
                signal: signal,
            });
        })
    });
}

export function rejectNonZeroReturn(result: SubprocessResult) {
    if (result.exit !== 0) {
        throw new Error(`subprocess returned non-zero: ${result.exit}`);
    }
    return result;
}