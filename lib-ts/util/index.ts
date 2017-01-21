export { chunkToLines, readFile, readLines } from './text';

export { logger_normal, logger_silent } from './logger';

export { liftA2 } from './transforms';

export function isTruthy(v: any) {
    return !!v;
}