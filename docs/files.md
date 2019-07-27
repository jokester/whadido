## Files

Files inside [jokester/whadido](https://github.com/jokester/whadido)

```text
src/cli/            CLI: entrypoint, options parsers, etc
src/formatter/      format recovered operations and print to terminal

src/git/            a git repo reader in pure js
src/analyze/        heuristics to recover git operations from reflogs
src/parser/         a quite limited parser combinator
src/webui/          a web ui to preview reflogs / analyze results. only useful when developing whadido.
src/vendor/         code for other repositories libraries

test/               test assets
tmp/                persisted test snapshots
docs/               docs
```

The structure is based on my another repo, [typescript-boilerplate](https://github.com/jokester/typescript-boilerplate/node-lib).
