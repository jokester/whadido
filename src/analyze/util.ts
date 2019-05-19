import * as Op from './operations';
import { deepFreeze } from '../vendor/ts-commonutil/type';

export function op2obj(op: Op.Operation): {} {
  const p1 = { className: op.type };
  const { type, ...p2 } = op;
  return { className: op.type, ...p2 };
}

export const CONST = deepFreeze({
  HEAD: 'HEAD',
  voidObject: '0000000000000000000000000000000000000000',
});
