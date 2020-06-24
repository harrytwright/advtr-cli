#!/usr/bin/env node

;(function () {
  process.title = 'advtr';

  const fs = require('fs');
  const path = require('path');
  const assert = require('assert');
  const childProcess = require('child_process')
  const util = require('util')

  const ora = require('ora');
  const nopt = require('nopt');

  const debug = util.debuglog('advtr')
  const exec = util.promisify(childProcess.exec);

  Builder.BuildStatus = {
    INITIALISED: 0,
    PRE_BUILD: 1,
    BUILD: 2,
    POST_BUILD: 3,
    PUSH: 4,
    POST_PUSH: 5,
    COMPLETE: -1
  };

  Builder.BuildStatusMap = { }
  Object.keys(Builder.BuildStatus).forEach((key) => {
    Builder.BuildStatusMap[key.toLowerCase()] = Builder.BuildStatus[key]
  });

  function DockerImage(data, build) {
    this.build = build

    this.name = data.name
    this.dockerfile = path.join(config.file, data.dockerfile || '.')
    this.defaultTag = data.defaultTag || 'latest'

    this.parsedBuildArgs = new Map([ ])
    if (data.build_arguments) {
      let args = { map: new Map(), types: { } }
      // Reads the original options from the yaml
      data.build_arguments.forEach((argument) => {
        let [value, key] = argument.split("=")

        // This is for nopt to read the args
        args.types[key] = String

        // This is a small cache for the build
        // argument and its env variable counterpart
        args.map.set(key, value);
      });

      this.buildArgs = args.map;
      const currentConfigs = nopt(args.types, { }, config.argv.original, 0);

      Object.keys(currentConfigs).forEach((key) => {
        if (args.map.has(key)) {
          this.parsedBuildArgs.set(args.map.get(key), currentConfigs[key]);
        }
      });

      if (!config['pass-args'] && this.parsedBuildArgs.size !== args.map.size) {
        let missing = []
        args.map.forEach((value, key) => {
          if (this.buildArgs.has(value)) return
          missing.push(`--${key}`);
        });

        let error = new Error('Invalid build arguments');
        error.code = 1001;
        error.missingArguments = missing;
        throw error;
      }
    }

    this.removeArtifacts = data.rm || false;
  }

  function Registry(data, _hub = false) {
    this.name = data.name
    this.url = data.url

    this._hub = _hub
  }

  function Stage(stage, cmds) {
    this.stage = stage;
    this.commands = cmds;
  }

  function createBuildStage(image) {
    const createTag = (image, tag) => {
      const base = `${registry.name === 'docker' ? config.user || require("os").userInfo().username : registry.url}`
      return `-t ${base}/${image.name}:${tag}`
    };

    const createEnvironmentVariables = (image) => {
      const variables = []
      image.parsedBuildArgs.forEach((value, key) => {
        variables.push(`--build-arg ${key}=${value}`);
      });

      return variables.join()
    };

    return new Stage('build', [
      [
        "docker",
        "build",
        Array.isArray(config.tag) ? (config.tag.map((tag) => createTag(image, tag))).join(' ') : createTag(image, config.tag || image.defaultTag),
        createEnvironmentVariables(image),
        image.removeArtifacts ? '--rm' : null,
        `./${path.relative(process.cwd(), image.dockerfile)}`
      ].join(' ').trim()
    ])
  }

  // set status to 0 so we can build it before creation
  // will move it to
  function Builder(image, build, status = Builder.BuildStatus.INITIALISED) {
    this.build = build;
    this.status = status;
    this.tag = config.tag || image.defaultTag;

    this.name = image.name;

    this.stages = [
      createBuildStage(image)
    ]
  }

  Builder.prototype.run = async function(_stage, spinner = { text: '', fail: () => { } }) {
    this.status = Builder.BuildStatusMap[_stage];
    spinner.text = `running ${_stage}`

    const commands = this.stages.filter((stage) => stage.stage === _stage).map((stage) => stage.commands).flat();

    for (let i = 0; i < commands.length; i++) {
      let command = commands[i];
      debug(`\n\$ ${command}`);

      try {
        const { stdout } = await exec(command)

        debug("\n========================\n")
        debug(stdout);
        debug("\n========================\n")
      } catch (err) {
        spinner.fail(err.message);
        process.exit(1);
      }
    }
  }

  const opts = nopt({
    file: path,
    loglevel: ['silent', 'error', 'notice', 'verbose'],
    'pass-args': Boolean,
    tag: [Array, String],
    usage: Boolean,
    user: [null, String]
  });

  const _ = require('lodash');
  const config = _.defaults(opts, {
    file: process.cwd(),
    loglevel: 'notice',
    'pass-args': false,
    tag: null,
    usage: false,
    user: null
  });

  const dockerHub = new Registry({ name: 'docker' }, true);

  const loadingSpinner = ora('Loading .advtrc').start();

  let data;
  try {
    let fileContents = fs.readFileSync(path.join(config.file, '.advtrc'), 'utf8');
    data = require('js-yaml').safeLoad(fileContents);

    /** Here is where we should validate the yaml */
    loadingSpinner.text = 'Validating .advtrc';
  } catch (e) {
    loadingSpinner.fail(`Loading .advtrc failed\n\t\$ ${e.message}`);
    process.exit(1);
  }

  let images = [], registry = dockerHub;
  Object.keys(data).forEach((key) => {
    switch (key) {
      case 'version': assert(data[key] === '1.0'); return;
      case 'services': {
        let services = data[key];
        Object.keys(services).forEach((key) => {
          try {
            images.push(new DockerImage(services[key], key));
          } catch (err) {
            loadingSpinner.fail(`Reading .advtrc failed\n  \$ ${err.message}`);
            return process.exit(1);
          }
        });
        break;
      }
      case 'registry': {
        let base = data[key];
        Object.keys(base).forEach((key) => {
          let data = _.defaults({ name: key }, base[key]);
          if (key === 'docker') return;
          registry = new Registry(data)
        });
      }
    }
  });

  loadingSpinner.succeed('Loaded .advtrc');

  /**
   * 1) Check if the remaining argv containers a name of an image
   *    if so then just run that one only
   * 2) Run each one by one
   * */

    // Check if we have added a target to build, if not use all
  let names = images.map((image) => image.build).filter((name) => {
      return config.argv.remain.includes(name);
    });

  // Or just use them all probably an easier way but meh for now
  if (names.length === 0) names = images.map((image) => image.build);

  // filter the images and reset them to remove the ones not needed
  images = images.filter((image) => names.includes(image.build));

  console.time('advtr:build')
  console.log(`\n==> Building Images`)
  console.log('  ' + names.join('\n  '))
  debug(images)

  const builds = images.map((image) => {
    return new Builder(image, image.build);
  });

  run(builds).then(() => {
    console.log();
    console.timeEnd('advtr:build')
  }).catch((error) => {
    console.timeEnd('advtr:build')
    console.error(error);

    process.exit(1);
  }).finally(() => process.exit(0));

  async function run(builds) {
    for (let i = 0; i < builds.length; i++) {
      let build = builds[i];

      console.log()
      console.time(`advtr:build:${build.build}`)

      const spinner = ora(`Running ${build.build}`).start();
      spinner.stream = process.stdout
      spinner.discardStdin = false

      await build.run('build');

      spinner.succeed(`Built ${build.build}\n`)
      console.timeEnd(`advtr:build:${build.build}`)
    }
  }

  // for (let i = 0; i < builds.length; i++) {
  //   let build = builds[i];
  //
  //   console.log()
  //   console.time(`advtr:build:${build.build}`)
  //   const spinner = ora(`Running ${build.build}`).start();
  //
  //   spinner.succeed(`Built ${build.build}`)
  //   console.timeEnd(`advtr:build:${build.build}`)
  // }
  //
  // builds.forEach((build) => {
  //   console.log()
  //   console.time(`advtr:build:${build.build}`)
  //   const spinner = ora(`Running ${build.build}`).start();
  //
  //   build.run('build', spinner);
  //
  //   spinner.succeed(`Built ${build.build}`)
  //   console.timeEnd(`advtr:build:${build.build}`)
  // });

})();
