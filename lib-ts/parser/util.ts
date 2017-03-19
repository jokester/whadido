
// a reducer that concats
export function concatReducer<M>(prev: M[], item: M[], itemIndex: number, items: M[][]) {
    return (prev || []).concat(item);
}