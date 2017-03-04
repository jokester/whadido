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

## Screenshot

<!-- TODO -->

## How does it work?

*whadido* analyze recovers what happened by analyzing reflogs and branches / tags / commits.

(It only reads from local file and make no modification, don't be nervous.)

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

## Usage

```bash
$ whadido .
[2017-01-01 (3 days ago)] push branch <> to <origin>
[2017-01-01 (3 days ago)] created 3 commits in <branch>


```

## Help

In case whadido fails to analyze your operations, you can dump your local reflogs with `whadido --dump`, and create a GitHub issue or mail me in private.

NOTE: even though this dump does not include content of commits, you are still advised to check before showing it to anyone else.

Content of a dump:

- name of branches / tags / remote repository (not URLs of them)
- timestamp of commit / checkout / push / fetch
- log message of commits created by you
- your email

## Development

Issues / PRs are always welcome :) .

See `FILES.md` for code structure.

Based on [typescript-boilerplate](https://github.com/jokester/typescript-boilerplate)

## License

MIT
