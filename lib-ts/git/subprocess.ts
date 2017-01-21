import { spawn, SpawnOptions } from 'child_process';
import { chunkToLines } from '../util';

interface SubprocessResult {
    stderr: string[]
    stdout: string[]
    exit: number
    signal: string
}

/**
 * spawn a subprocess and capture its stdout/stderr/return value
 * 
 * rejects if the subprocess could not be spawned
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