/**
 * @fileoverview `ExtractedConfig` class.
 *
 * `ExtractedConfig` class expresses a final configuration for a specific file.
 * */

const { resolve } = require('path')

class ExtractedConfig {
  constructor () {
    this.builds = {}

    this.matrices = []

    this.registry = {}
  }

  /**
   * Handle the raw build data and convert them to a valid object
   *
   * We also add the default values here, moving from snack_case to
   * camel case where snack_case is used.
   *
   * @param {Object} services The raw data, this should be a Map<Build>
   * @return {ExtractedConfig} the new updated data
   * */
  handleBuild (services) {
    Object.keys(services).forEach((key) => {
      const service = services[key]

      const cmdList = [
        'build',
        'push'
      ].reduce(function (l, p) {
        return l.concat(['pre' + p, p, 'post' + p])
      }, [])

      this.builds[key] = {
        name: service.name || key,
        dockerfile: service.dockerfile || !service.file ? '.' : null,
        file: service.file ? resolve(service.file) : null,
        defaultTag: service.default_tag || service.defaultTag || 'latest',
        rm: service.rm || false
      }

      cmdList.filter(el => !['build', 'push'].includes(el)).forEach((cmd) => {
        this.builds[key][cmd] = service[cmd.replace(/(pre|post)/igm, (_, index) => `${index}_`)] || service[cmd] || []
      })

      this.builds[key].buildArguments = (service.build_arguments || service.buildArguments)?.map((el) => new RawBuildArgument(el).validate())
    })

    return this
  }

  /**
   * Handle the raw matrices and convert them to the valid array of objects
   *
   * We also add the default values here, moving from snack_case to
   * camel case where snack_case is used.
   *
   * @param {Object} matrices The raw matrices
   * @return {ExtractedConfig} the new updated data
   * */
  handleMatrices (matrices) {
    let _matrices
    if (Array.isArray(matrices)) {
      _matrices = Array.from(matrices)
    } else {
      _matrices = []
      Object.keys(matrices).forEach(key => {
        _matrices.push({
          tag: key,
          ...matrices[key]
        })
      })
    }

    _matrices.forEach((_matrix) => {
      const matrix = {
        tag: _matrix.tag
      }

      const argumentMap = new Map([]);
      (_matrix.build_arguments || _matrix.buildArguments)?.forEach((argument) => argumentMap.set(...argument.split('=')))
      if (argumentMap.size > 0) matrix.buildArguments = argumentMap

      if (_matrix.file) matrix.file = resolve(_matrix.file)

      this.matrices.push(matrix)
    })

    return this
  }

  /**
   * Handle the raw registry data and convert them to a valid object
   *
   * The only items here, as of now, are `uri`
   *
   * @param {Object} registries The raw registry data
   * @return {ExtractedConfig} the new updated data
   * */
  handleRegistry (registries) {
    Object.keys(registries).forEach((key) => {
      const registry = registries[key]
      if (key === 'docker') { this.registry[key] = true; return }
      if (!registry.uri && !registry.url) throw new Error('Invalid raw data')

      this.registry[key] = {
        uri: registry.uri || registry.url
      }
    })

    return this
  }
}

function RawBuildArgument (argument) {
  if (typeof argument === 'string') {
    const map = argument.split('=')
    this.argument = map[0]
    this.option = map[1]
  } else {
    this.argument = argument.argument
    this.option = argument.option
    this.defaultValue = argument.default_value || argument.defaultValue
  }
}

RawBuildArgument.prototype.validate = function () {
  if (!this.argument || !this.option) throw new RawBuildArgumentError(this)
  if (!this.defaultValue) delete this.defaultValue
  return this
}

class RawBuildArgumentError extends Error {
  constructor (argument) {
    super('Raw build argument is invalid')
    this.argument = argument
  }
}

module.exports = {
  ExtractedConfig,
  // For testing only
  RawBuildArgument
}
