import { TotalOrdered } from "../vendor/ts-commonutil/algebra/total-ordered";

export function mergeOrderedSequence<T>(input: T[][], order: TotalOrdered<T>): T[] {
  const lists = input.map(l => l.slice());

  const merged: T[] = [];

  while (true) {
    const peek: T[] = [];
    for (const l of lists) {
      if (l.length) peek.push(l[0]);
    }

    if (/* already consumed all */ !peek.length) break;

    const firstPeek = order.sort(peek)[0];

    merged.push(firstPeek);

    for (const l of lists) {
      if (l.length && order.equal(firstPeek, l[0])) l.shift();
    }
  }

  return merged;
}
