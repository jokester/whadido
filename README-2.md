
<!-- TODO: example
## Usage

```bash
$ whadido .
[2017-01-01 (3 days ago)] push branch <> to <origin>
[2017-01-01 (3 days ago)] created 3 commits in <branch>

```
-->

------------

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

