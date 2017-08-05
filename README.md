# whadido

Recover recent operations in a git repository.

Have you been asking yourself *what did i do?* on a shiny Monday morning? If so, whadido is made for you.

> What did I do?
> What are you doing?
> What should I do?
> What are you going to do?
> *Hey, buddy, whadido?*
>
> --- [urbandictionary / whadido](https://www.urbandictionary.com/define.php?term=whadido)

<!-- TODO Screenshot -->

<!-- TODO -->

## How does it work?

*whadido* recovers what happened to repository by analyzing reflogs of HEAD / branches / tags / commits.

## Requirements

- `git` binary in `$PATH`
- `node.js` v4 or newer (GYP is not required)

## Install

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

<!-- TODO: example
## Usage

```bash
$ whadido .
[2017-01-01 (3 days ago)] push branch <> to <origin>
[2017-01-01 (3 days ago)] created 3 commits in <branch>

```
-->

## Help `whadido` recognize more patterns

`whadido` uses a hand-crafted heuristics to recover operations from reflogs, which can be incomplete or incorrect.

If it fails to recognize your reflogs, you can make it better by dumping
your reflogs (`whadido --dump > dump.json`)
and [create a issue](https://github.com/jokester/whadido/issues)
or [mail me in private](mailto:me@jokester.io?subject=whadido-dump) in private.

WARNING: this dump may contain sensitive data,
Please check its content before showing it to anyone else.

A dump *may* include:

- *name* of branches / tags / remote repository
- *sha1* of commits
- *timestamp* of commit / checkout / push / fetch / other operations
- *log message* of commits created by you
- *name and email* of git commiters

A dump *does not* include:

- *content* of commits, work tree and index
- *URL* and *path* of repository

## Development

Issues / PRs are always welcome :) .

See `FILES.md` for code structure, and `ANALYZER.md` for recover heuristics.

Based on [typescript-boilerplate](https://github.com/jokester/typescript-boilerplate)

## License

MIT
