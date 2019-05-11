import { spawn, exec, execFile, SpawnOptions, ChildProcess, ExecOptions, ExecFileOptions } from 'child_process';
import { chunkToLines } from '../vendor/ts-commonutil/text/chunk-to-lines';

/**
 * Result after subprocess finished
 */
interface SubprocessResult {
  stderr: string[];
  stdout: string[];
  error?: unknown;
  exit?: number;
  signal?: string;
}

/**
 * spawn a subprocess and capture its stdout/stderr/return value
 *
 * rejects if the subprocess could not be spawned
 *
 * TODO change this to a process class
 */
export function getSubprocessOutput(command: string, args: string[] = [], options?: ExecFileOptions) {
  return new Promise<SubprocessResult>((fulfill, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      try {
        fulfill({
          error,
          stdout: chunkToLines(stdout),
          stderr: chunkToLines(stderr),
        });
      } catch (e) {
        reject(e);
      }
    });
  });
}

export function rejectNonZeroReturn(result: SubprocessResult) {
  if (result.exit !== 0) {
    throw new Error(`subprocess returned non-zero: ${result.exit}`);
  }
  return result;
}
