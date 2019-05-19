export namespace Arrays {
  export function allEqual(a: any[]): boolean {
    return a.every((v, i) => v === a[0]);
  }
}
