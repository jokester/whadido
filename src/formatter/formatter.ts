import { Obj, Ref } from '../git/types';

type ReflogElement = Date | Obj.Commit | Ref.Ref;

type ReflogLine = ReflogElement[];

export interface ReflogFormatter {
  line(line: ReflogLine): void;
}
