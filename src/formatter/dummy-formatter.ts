import { ReflogFormatter, ReflogLineFormatter } from './text-line-formatter';
import { PATTERNS } from '../git/parser';
import { stripRefPrefix } from '../git/util';
import { Timestamp } from '../git';
import moment = require('moment');

export class DummyFormatter implements ReflogFormatter {
  lines: string[][] = [];
  readonly debugEnabled = true;
  debug(value: unknown): this {
    return this.line(l => l.debug(value));
  }

  line(contentGenerator?: (formatter: ReflogLineFormatter) => void): this {
    const newLine: string[] = [];
    this.lines.push(newLine);

    if (contentGenerator) {
      contentGenerator(new DummyLineFormatter(newLine));
    }

    return this;
  }
}

class DummyLineFormatter implements ReflogLineFormatter {
  constructor(private readonly line: string[]) {}

  private wrap = (tag: string) => (text: string) => {
    this.line.push(`${tag}{${text}}`);
    return this;
  };

  comment = this.wrap('comment');

  debug = this.wrap('debug');

  errorText = this.wrap('errorText');

  localRef = this.wrap('localRef');

  pad(): this {
    this.text('PAD');
    return this;
  }

  remoteRef = this.wrap('remoteRef');

  sha1 = this.wrap('sha1');

  sha1Array(...sha1Array: string[]): this {
    sha1Array.forEach(this.sha1);
    return this;
  }

  text = this.wrap('text');

  timestamp(ts: Timestamp): this {
    const absTime = moment(ts.utcSec * 1e3).utcOffset(ts.tz);
    const timeStr = absTime.toISOString();
    return this.text(`timestamp(${timeStr})`);
  }

  warnText = this.wrap('warnText');

  commitish(commitish: string): this {
    if (PATTERNS.refpath.localBranch.test(commitish)) {
      return this.localRef(stripRefPrefix(commitish));
    } else if (PATTERNS.refpath.remoteBranch.test(commitish)) {
      return this.remoteRef(stripRefPrefix(commitish));
    } else if (PATTERNS.refpath.localHead.test(commitish)) {
      return this.localRef(commitish);
    } else if (PATTERNS.refpath.remoteHead.test(commitish)) {
      return this.remoteRef(commitish);
    } else if (PATTERNS.objectSha1.test(commitish)) {
      return this.sha1(commitish);
    }
    return this.text(`commitish(${commitish})`);
  }
}
