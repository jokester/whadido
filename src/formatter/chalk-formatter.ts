import chalk from 'chalk';
import moment from 'moment';
import util from 'util';

import { ReflogFormatter, ReflogLineFormatter } from './text-line-formatter';
import { isTimestamp, Obj, Ref, Timestamp } from '../git';
import { CONST } from '../analyze/util';
import { PATTERNS } from '../git/parser';
import { stripRefPrefix } from '../git/util';

interface ChalkFormatterOption {
  debug?: boolean;
  gitSha1Length: number;
  printLn(...args: string[]): void;
}

export class ChalkLineFormatter implements ReflogLineFormatter {
  private readonly elements: string[] = [];

  constructor(readonly option: ChalkFormatterOption) {}
  date(date: Date) {
    const absTime = moment(date).local();
    const timeStr = `${absTime.toString()} (${absTime.fromNow()})`;
    this.elements.push(chalk.yellow(timeStr));
    return this;
  }

  text(text: string): this {
    this.elements.push(text);
    return this;
  }

  debug(value: unknown): this {
    if (this.option.debug) this.elements.push(util.format('%o', value));
    return this;
  }

  warnText(text: string): this {
    return this.text(chalk.yellowBright(text));
  }

  errorText(text: string): this {
    return this.text(chalk.red(text));
  }

  comment(text: string): this {
    return this.text(chalk.gray(text));
  }

  commit(c: Obj.Commit): this {
    return this.sha1(c.sha1);
  }

  remoteRef(refPath: string): this {
    this.elements.push(chalk.blue(refPath));
    return this;
  }

  localRef(refPath: string): this {
    this.elements.push(chalk.magenta(refPath));
    return this;
  }

  sha1(sha1: string): this {
    const short = sha1.slice(0, this.option.gitSha1Length);
    return this.sha1Color(short);
  }

  commitish(refPath: string): this {
    this.elements.push(chalk.cyan(refPath));
    return this;
  }

  private sha1Color(sha1: string): this {
    this.elements.push(chalk.green(sha1));
    return this;
  }

  pad(num = 1): this {
    for (let i = 0; i < num; i++) {
      this.elements.push(' ');
    }
    return this;
  }

  sha1Array(...sha1Array: string[]) {
    sha1Array.forEach((sha1, index) => {
      if (sha1 === CONST.voidObject) {
        this.sha1Color('(absent)');
      } else {
        this.sha1(sha1);
      }
      if (index < sha1Array.length - 1) {
        this.comment('=>');
      }
    });
    return this;
  }

  timestamp(ts: Timestamp): this {
    const absTime = moment(ts.utcSec * 1e3).utcOffset(ts.tz);
    const timeStr = `${absTime.toString()} (${absTime.fromNow()})`;
    this.elements.push(chalk.yellow(timeStr));
    return this;
  }

  end(): void {
    this.option.printLn(...this.elements);
  }
}
export class ChalkFormatter implements ReflogFormatter {
  constructor(private readonly option: Readonly<ChalkFormatterOption>) {}
  get debugEnabled() {
    return this.option.debug || false;
  }
  line(contentGenerator?: (formatter: ReflogLineFormatter) => void): this {
    const line = new ChalkLineFormatter(this.option);
    contentGenerator && contentGenerator(line);
    line.end();
    return this;
  }

  debug(value: unknown): this {
    this.option.printLn(util.format('%o', value));
    return this;
  }
}
