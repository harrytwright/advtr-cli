#!/usr/bin/env node

(function () {
  process.title = 'advtr'

  const fs = require('fs')
  const path = require('path')
  const assert = require('assert')
  const childProcess = require('child_process')
  const util = require('util')

  const ora = require('ora')
  const nopt = require('nopt')

  const debug = util.debuglog('advtr')
  const exec = util.promisify(childProcess.exec)

  const opts = nopt({
    file: path,
    loglevel: ['silent', 'error', 'notice', 'verbose'],
    'pass-args': Boolean,
    push: Boolean,
    tag: [Array, String],
    usage: Boolean,
    user: [null, String]
  }, {
    help: ['--usage'],
    T: ['--tag'],
    U: ['--user']
  })

  const _ = require('lodash.defaults')
  const config = _(opts, {
    file: process.cwd(),
    loglevel: 'notice',
    'pass-args': false,
    push: false,
    tag: null,
    usage: false,
    user: null
  })

  if (config.usage) {
    console.log([
      'Advtr Dockerfile builder:',
      '',
      '  $ advtr --file .',
      '',
      'Options:',
      '',
      '  -T, --tag\tThe tag or version number, can be set multiple times',
      '  -U, --user\tThe hub username',
      '      --push\tBoolean option to tell advtr to publish the images',
      '      --help\tShow help banner'
    ].join('\n'))
    return
  }

  const kGlobalCommands = new Set([
    'before_build',
    'build',
    'post_build',
    'push',
    'post_push'
  ])

  function DockerImage (data, build) {
    this.build = build

    this.name = data.name
    this.dockerfile = path.join(config.file, data.dockerfile || '.')
    this.defaultTag = data.default_tag || 'latest'

    this.before_build = data.before_build
    this.post_build = data.post_build
    this.post_push = data.post_push

    this.parsedBuildArgs = new Map([])
    if (data.build_arguments) {
      const args = { map: new Map(), types: { } }
      // Reads the original options from the yaml
      data.build_arguments.forEach((argument) => {
        const [value, key] = argument.split('=')

        // This is for nopt to read the args
        args.types[key] = String

        // This is a small cache for the build
        // argument and its env variable counterpart
        args.map.set(key, value)
      })

      this.buildArgs = args.map
      const currentConfigs = nopt(args.types, { }, config.argv.original, 0)

      Object.keys(currentConfigs).forEach((key) => {
        if (args.map.has(key)) {
          this.parsedBuildArgs.set(args.map.get(key), currentConfigs[key])
        }
      })

      if (!config['pass-args'] && this.parsedBuildArgs.size !== args.map.size) {
        const missing = []
        args.map.forEach((value, key) => {
          if (this.buildArgs.has(value)) return
          missing.push(`--${key}`)
        })

        const error = new Error('Invalid build arguments')
        error.code = 1001
        error.missingArguments = missing
        throw error
      }
    }

    this.removeArtifacts = data.rm || false
  }

  function Registry (data, hub = false) {
    this.name = data.name
    this.url = data.url

    this.hub = hub
  }

  let registry = new Registry({ name: 'docker' }, true)

  function Stage (stage, cmds) {
    this.stage = stage
    this.commands = cmds
  }

  function createStage (stage, image) {
    if (!image[stage]) return null
    return new Stage(stage, image[stage])
  }

  function createBuildStage (image) {
    const createTag = (image_, tag) => {
      const base = `${registry.name === 'docker' ? config.user || require('os').userInfo().username : registry.url}`
      return `-t ${base}/${image_.name}:${tag}`
    }

    const createEnvironmentVariables = (image_) => {
      const variables = []
      image_.parsedBuildArgs.forEach((value, key) => {
        variables.push(`--build-arg ${key}=${value}`)
      })

      return variables.join()
    }

    return new Stage('build', [
      [
        'docker',
        'build',
        Array.isArray(config.tag) ? (config.tag.map((tag) => createTag(image, tag))).join(' ') : createTag(image, config.tag || image.defaultTag),
        createEnvironmentVariables(image),
        image.removeArtifacts ? '--rm' : null,
        `${path.relative(process.cwd(), image.dockerfile) || '.'}`
      ].filter((el) => el).join(' ').trim()
    ])
  }

  function createPushStage (image) {
    const createTag = (image_, tag) => {
      const base = `${registry.name === 'docker' ? config.user || require('os').userInfo().username : registry.url}`
      return `'${base}/${image_.name}:${tag}'`
    }

    // https://github.com/docker/cli/issues/267#issuecomment-511052637
    return new Stage('push', [
      [
        'echo',
        Array.isArray(config.tag) ? (config.tag.map((tag) => createTag(image, tag))).join(' ') : createTag(image, config.tag || image.defaultTag),
        '|',
        'xargs',
        '-n 1',
        'docker',
        'push'
      ].join(' ')
    ])
  }

  // set status to 0 so we can build it before creation
  // will move it to
  function Builder (image, build, status = 0) {
    this.build = build
    this.status = status
    this.tag = config.tag || image.defaultTag

    this.name = image.name

    this.stages = [
      createStage('before_build', image),
      createBuildStage(image),
      createStage('post_build', image),
      config.push ? createPushStage(image) : null,
      createStage('post_push', image)
    ].filter((el) => el)
  }

  Builder.BuildStatus = {
    INITIALISED: 0,
    PRE_BUILD: 1,
    BUILD: 2,
    POST_BUILD: 3,
    PUSH: 4,
    POST_PUSH: 5,
    COMPLETE: -1
  }

  Builder.BuildStatusMap = { }
  Object.keys(Builder.BuildStatus).forEach((key) => {
    Builder.BuildStatusMap[key.toLowerCase()] = Builder.BuildStatus[key]
  })

  Builder.prototype.run = async function (stage, spinner = { text: '', fail: () => { } }) {
    this.status = Builder.BuildStatusMap[stage]
    // eslint-ignore no-param-reassign
    spinner.text = `Running ${stage}`

    const commands = this.stages
      .filter((stage_) => stage_.stage === stage)
      .map((stage_) => stage_.commands).flat()

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      debug(`\n$ ${command}`)

      try {
        const { stdout } = await exec(command)

        debug('')
        debug(stdout)
      } catch (err) {
        spinner.fail(err.message)
        process.exit(1)
      }
    }
  }

  const loadingSpinner = ora('Loading .advtrc').start()

  let data
  try {
    const fileContents = fs.readFileSync(path.join(config.file, '.advtrc'), 'utf8')
    data = require('js-yaml').safeLoad(fileContents)

    assert.strictEqual(parseFloat(data.version), 1.0)

    /** Here is where we should validate the yaml */
    loadingSpinner.text = 'Validating .advtrc'
  } catch (e) {
    loadingSpinner.fail(`Loading .advtrc failed\n\t$ ${e.message}`)
    process.exit(1)
  }

  let images = []
  Object.keys(data).forEach((key) => {
    switch (key) {
      case 'version': assert(data[key] === '1.0'); break
      case 'services': {
        const services = data[key]
        Object.keys(services).forEach((key_) => {
          try {
            return images.push(new DockerImage(services[key_], key_))
          } catch (err) {
            loadingSpinner.fail(`Reading .advtrc failed\n  $ ${err.message}`)
            return process.exit(1)
          }
        })
        break
      }
      case 'registry': {
        const base = data[key]
        Object.keys(base).forEach((key_) => {
          const data_ = _.defaults({ name: key_ }, base[key_])
          if (key_ === 'docker') return
          registry = new Registry(data_)
        })
        break
      }
      default: throw new Error('Invalid Case')
    }
  })

  loadingSpinner.succeed('Loaded .advtrc')

  /**
   * 1) Check if the remaining argv containers a name of an image
   *    if so then just run that one only
   * 2) Run each one by one
   * */

  // Check if we have added a target to build, if not use all
  let names = images
    .map((image) => image.build)
    .filter((name) => config.argv.remain.includes(name))

  // Or just use them all probably an easier way but meh for now
  if (names.length === 0) names = images.map((image) => image.build)

  // filter the images and reset them to remove the ones not needed
  images = images.filter((image) => names.includes(image.build))

  console.time('advtr:build')
  console.log('\n==> Building Images')
  console.log(`  ${names.join('\n  ')}`)
  debug(images)

  const builds = images.map((image) => new Builder(image, image.build))

  async function run (builds_) {
    for (let i = 0; i < builds_.length; i++) {
      const build = builds_[i]

      console.log()
      console.time(`advtr:build:${build.build}`)

      const spinner = ora(`Running ${build.build}`).start()
      spinner.stream = process.stdout
      spinner.discardStdin = false

      for (const command of kGlobalCommands) {
        await build.run(command, spinner)
      }

      spinner.succeed(`Built ${build.build}\n`)
      console.timeEnd(`advtr:build:${build.build}`)
    }
  }

  run(builds).then(() => {
    console.log()
    console.timeEnd('advtr:build')
  }).catch((error) => {
    console.timeEnd('advtr:build')
    console.error(error)

    process.exit(1)
  }).finally(() => process.exit(0))
}())
