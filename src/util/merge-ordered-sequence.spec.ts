import { mergeOrderedSequence } from './merge-ordered-sequence';
import { NumberTotalOrdered } from "../vendor/ts-commonutil/algebra/total-ordered";

describe('mergeOrderedSequence', () => {
  const numberOrder = new NumberTotalOrdered();

  it('merged', () => {
    expect(mergeOrderedSequence([], numberOrder)).toEqual([]);

    expect(mergeOrderedSequence([[1, 2, 3], [1, 2, 3]], numberOrder)).toEqual([1, 2, 3]);

    expect(mergeOrderedSequence([[1, 2, 3], [1, 3, 4]], numberOrder)).toEqual([1, 2, 3, 4]);

    expect(mergeOrderedSequence([[1, 6, 2, 100], [1, 3, 4]], numberOrder)).toEqual([1, 3, 4, 6, 2, 100]);
  });
});
