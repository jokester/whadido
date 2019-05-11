import { Obj, Ref, Timestamp } from '../git';

export type ReflogElement = Date | Obj.Commit | Ref.Ref | Timestamp;

export type ReflogLine = ReflogElement[];

export interface ReflogLineFormatter {
  warnText(text: string): this;
  errorText(text: string): this;
  text(text: string): this;
  comment(text: string): this;
  ref(ref: Ref.Ref): this;
  // debug(value: any): this;
  timestamp(t: Timestamp): this;
  sha1(sha1: string): this;
}

export interface ReflogFormatter {
  line(contentGenerator: (formatter: ReflogLineFormatter) => void): this;
  debug(value: unknown): this;
}
