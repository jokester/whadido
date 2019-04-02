# whadido

Recover recent operations in a git repository. **still in early development**

Have you been asking yourself *what did i do?* on a shiny Monday morning? `whadido` may give an [hint](https://www.urbandictionary.com/define.php?term=whadido).

[![CircleCI](https://circleci.com/gh/jokester/whadido.svg?style=svg)](https://circleci.com/gh/jokester/whadido)
[![codecov](https://codecov.io/gh/jokester/whadido/branch/master/graph/badge.svg)](https://codecov.io/gh/jokester/whadido)

<!-- TODO Screenshot -->

## How does it work?

*whadido* (tries to) recover your local operation history from mysterious ref-logs (`git reflog`).

## Requirements

- `git` binary in `$PATH`
- `node.js` v8 or newer (GYP is not required)

## Install and Use

```bash
$ npm install -g whadido

$ whadido -h
usage: whadido [-h] [-v] [--dump] PATH

whadido: Analyze recent operations in local git repository

Positional arguments:
  PATH           Root of repository or somewhere inside it. Defaults to $PWD

Optional arguments:
  -h, --help     Show this help message and exit.
  -v, --version  Show program's version number and exit.
  --dump         dump refs and reflogs of repo. Most for development use.
```

## Development

Just file a issue :)

See `FILES.md` for code structure, and `ANALYZER.md` for recover heuristics.

Based on [typescript-boilerplate](https://github.com/jokester/typescript-boilerplate/node-lib)

## License

MIT
