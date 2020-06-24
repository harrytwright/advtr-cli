## Roadmap

- [X] Run terminal commands async
- [ ] Run all commands from the `.advtrc` and keep them in order, may need to move to an `OrderedSet` than `Array`
- [ ]  Have a `file:` option inside of `.advtrc` to overwrite `dockerfile:` if used
- [ ]  PRUNE EVERYTHING
- [ ]  Separate to `./lib/*.js` but without the need for multi command support like usual (Only when we have a fully working CLI)
- [ ]  Have an `./index.js` entrypoint so advtr can be run from inside an app, allowing for testing

## Schema

```yaml
version: String

services:
  <build>:
    name: String

    # Dockerfile and file can not be used together
    # file will always overwrite dockerfile
    dockerfile: path? => `CWD()`
    file: path?

    default_tag: String? => 'latest'

    # These define custom cli arguments, the left side is the --build-arg
    # and right the required --argument, all right side arguments will be
    # required and will fail if not supplied unless `--pass-args` is supplied
    build_arguments: Map?

    <before||post>_build: Map?
    post_push: Map?

    rm: Boolean

registry:
  <registry>: # `docker` is default
    url: url
```
