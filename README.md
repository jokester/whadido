# whadido

`whadido` is a command line tool to recover and show recent operations in a local git repository.

Useful when you wonder "what did i do" in a shiny Monday morning.

[![CircleCI](https://circleci.com/gh/jokester/whadido.svg?style=svg)](https://circleci.com/gh/jokester/whadido)
[![codecov](https://codecov.io/gh/jokester/whadido/branch/master/graph/badge.svg)](https://codecov.io/gh/jokester/whadido)

## Screenshot

![screenshot](whadido-screenshot.png)

## Requirements

- Linux or Mac (may work in other unices too. **not** in Windows or WSL)
- `git` binary in `$PATH`
- `node.js` v8.0 or newer (GYP is not required)

## Install

```bash
$ npm install -g whadido

# OR

$ yarn global add whadido
```

## Usage

```
# Running `whadido` with no parameters in a repository prints recent 20 recovered operations.

$ whadido

# List of all parameters:

$ whadido --help

usage: whadido [-h] [-v] [-r REPO_PATH] [-n NUM_OF_OPERATIONS] [--verbose]
               [--dump]

Analyze and show history of local git repo.

Optional arguments:
  -h, --help            Show this help message and exit.
  -v, --version         Show program's version number and exit.
  -r REPO_PATH, --repo REPO_PATH
                        Path in git repository or its worktree.
                        Defaults to $PWD
  -n NUM_OF_OPERATIONS, --num NUM_OF_OPERATIONS
                        The number of (recent) git operations to display.
                        Defaults to 20
  --verbose             Enable verbose log. Most for development use.
  --dump                Dump refs and reflogs to a timestamp-named JSON file
                        in PWD. Most for development use.
```

## How does it work?

`whadido` recovers local operation history from often-mysterious reflogs (`git reflog`).

## Development

Feel free to file an issue :)

See `docs/files.md` for code structure, and `docs/parser.md` for analyze heuristics.

## License

MIT
