## Run

To run the test `.advtrc` copy:
```bash
$ node ./bin/advtr-cli.js --file ./test --npm 1234567890
```

## TODO

### `build_arguments`

Here we should also have the option for turning the current `Map<String>` into some sort of `Map<Argument>` where argument 
can be a string that looks like `ENV=arg` but we could do with:

```yaml
build_arguments:
  - argument: ENV
    option: arg
    default: 'hello-world'
```

This would allow for us to add default values, allowing a matrix to form where default can be overwritten based on the build

### `file:`

Allowing for better manipulation of where the dockerfile is hosted, using `dockerfile: *` points to the directory where the dockerfile
is located, but using `file: ./*/example.dockerfile` we can us multiple deployments based on a matrix where if we use multiple dockerfiles

### Prune everything

Look into every sort of pruning, and have them as a base `$ advtr` argument, this included squashing

> Not a priority

### Matrix

> Maybe a pipedream but sounds good

Similar to say `travis-ci` we could allow for multiple deployments from one build

```yaml
matrix:
  - tag: react
    build_arguments:
      - REACT_APP_BASE_URL=example.com
  - tag: local
    build_arguments:
      - REACT_APP_BASE_URL=localhost

services:
  search:
    name: geo-search
    build_arguments:
      - REACT_APP_BASE_URL=uri
```

Here, the only requirement is `tag`, it can either be an array or a key/value object, so the matrix is read first 
and creates a local configuration like so:

```javascript
const matrix = [
  { tag: "react", arguments: [["REACT_APP_BASE_URL", "example.com"]] },
  { tag: "local", arguments: [["REACT_APP_BASE_URL", "localhost"]] }
]
```

This is then used when we create the build steps, so creating multiple separate build stages with changes to the 
docker commands

> Might be able to build the multiple stages in parallel, but would have to check on the memory usage on `docker-hyperkit`

### Rewrite

Build `$ advtr` from the ground up to be executable from an `index.js` file like it is a package with a cli added on.

Move any extra methods out of `advtr-cli.js` and place them in their own files, could also refactor the docker commands 
into a small package, similar to how `@npmcli/git` has been produced, but this is not important.

This will not be like how the usual CLI's are sorted as we only have one command

Just like:

```bash
./bin/advtr-cli.js
./lib/docker/*.js
./lib/config/*.js
./lib/logger.js
./lib/parse.js
./lib/error.js
./lib/build.js
```

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
