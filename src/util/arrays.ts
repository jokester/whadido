export namespace Arrays {
  export function allEqual(a: any[]): boolean {
    return a.every((v, i) => v === a[0]);
  }

  export function removeConsequecitiveDup<T>(a: T[]): T[] {
    const dup: T[] = [];
    for (const [index, elem] of a.entries()) {
      if (!index || elem !== dup[dup.length - 1]) {
        dup.push(elem);
      }
    }
    return dup;
  }
}
