## Roadmap

- [X] Run terminal commands async
- [ ] Run all commands from the `.advtrc` and keep them in order, may need to move to an `OrderedSet` than `Array`
- [ ]  Have a `file:` option inside of `.advtrc` to overwrite `dockerfile:` if used
- [ ]  PRUNE EVERYTHING
- [ ]  Separate to `./lib/*.js` but without the need for multi command support like usual (Only when we have a fully working CLI)
- [ ]  Have an `./index.js` entrypoint so advtr can be run from inside an app, allowing for testing
