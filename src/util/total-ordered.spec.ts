import { NumberTotalOrdered, TotalOrdered } from './total-ordered';

describe('NumberTotalOrdered', () => {
  const n = new NumberTotalOrdered();
  it('sorts integer', () => {
    expect(n.sort([])).toEqual([]);

    expect(n.sort([1, 2, 3])).toEqual([1, 2, 3]);
    expect(n.sort([4, 6, 5])).toEqual([4, 5, 6]);
  });
});
