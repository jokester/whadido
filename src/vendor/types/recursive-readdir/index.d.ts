declare module 'recursive-readdir' {
  interface Callback {
    (error: unknown, entries: string[]): void;
  }

  function rReaddir(root: string, callback: Callback): void;

  export = rReaddir;
}
