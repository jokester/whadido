import { Obj, Ref, Timestamp } from '../git';

export type ReflogElement = Date | Obj.Commit | Ref.Ref | Timestamp;

export type ReflogLine = ReflogElement[];

export interface ReflogLineFormatter {
  // yellow ?
  warnText(text: string): this;
  // red ?
  errorText(text: string): this;
  // 1num = seemingly 2spaces
  pad(num?: number): this;
  // normal white
  text(text: string): this;
  // grey?
  comment(text: string): this;
  // localRef: pink
  localRef(refPath: string): this;
  // remoteRef: blue
  remoteRef(refPath: string): this;
  // sha1 OR localRef or remoteRef
  commitish(refPath: string): this;

  // remoteRef: ???
  debug(value: unknown): this;
  timestamp(t: Timestamp): this;
  sha1(sha1: string): this;
  sha1Array(...sha1Array: string[]): this;
}

export interface ReflogFormatter {
  readonly debugEnabled: boolean;
  line(contentGenerator?: (formatter: ReflogLineFormatter) => void): this;
  debug(value: unknown): this;
}
