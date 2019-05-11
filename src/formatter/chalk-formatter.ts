import chalk from 'chalk';
import moment from 'moment';
import util from 'util';

import { ReflogFormatter, ReflogLineFormatter } from './text-line-formatter';
import { isTimestamp, Obj, Ref, Timestamp } from '../git';

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

  ref(ref: Ref.Ref): this {
    return this;
  }

  sha1(sha1: string): this {
    const short = sha1.slice(0, this.option.gitSha1Length);
    this.elements.push(chalk.green(short));
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
