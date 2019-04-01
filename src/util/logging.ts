import { LogLevelDesc } from 'loglevel';
import { getLogLevelLogger } from '../vendor/ts-commonutil/logging/loglevel-logger';

const isProd = process.env.NODE_ENV === 'production';

export function getLogger(name: string, level: LogLevelDesc = 'WARN') {
  return getLogLevelLogger(name, level, isProd);
}
