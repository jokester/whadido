# whadido

Analyze and visualize recent operations in a local git repository.

Have you been asking *what did i do?* on a shiny Monday morning? If so, whadido is made for you.

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

*whadido* recovers what happened by analyzing reflogs and branches / tags / commits.

(It only reads from local file and make no modification, don't be nervous.)

## Install

```bash
$ npm install -g whadido
```

## Development

Contribution is always welcome :)

```
lib-ts/git          git reader
lib-ts/model        analyze
lib-ts/ui
lib-ts/util
lib-ts/_test_
```

Based on my [typescript-boilerplate](https://github.com/jokester/typescript-boilerplate).

## License

MIT
