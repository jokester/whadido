import * as Op from './operations';

export function op2obj(op: Op.Operation): {} {
  const p1 = { className: op.type };
  const { type, ...p2 } = op;
  return { className: op.type, ...p2 };
}

export const CONST = {
  HEAD: 'HEAD',
};
