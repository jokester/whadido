// a reducer that concats an array of arrays
export function concatReducer<M>(prev: M[], item: M[], itemIndex: number, items: M[][]) {
  return prev.concat(item);
}
