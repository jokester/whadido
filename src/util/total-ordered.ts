export abstract class TotalOrdered<T> {
  abstract before(a: T, b: T): boolean;

  abstract equal(a: T, b: T): boolean;

  sort(elems: T[]): T[] {
    return elems.sort((a, b) => {
      if (this.equal(a, b)) return 0;

      const before = this.before(a, b);
      return before ? -1 : 1;
    });
  }
}

export class NumberTotalOrdered extends TotalOrdered<number> {
  before(a: number, b: number): boolean {
    return a < b;
  }
  equal(a: number, b: number): boolean {
    return a === b;
  }
}
