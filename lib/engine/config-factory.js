const fs = require('fs'); const path = require('path'); const parse = require('./parse')

const configFilenames = [
  '.advtrc.yaml',
  '.advtrc.yml',
  '.advtrc.json',
  '.advtrc',
  'package.json'
]

/**
 * Create a new context with default values.
 * @param {ConfigFactory} slots The internal slots.
 * @param {"config" | "ignore" | "implicit-processor" | undefined} providedType The type of the current configuration. Default is `"config"`.
 * @param {string | undefined} providedName The name of the current configuration. Default is the relative path from `cwd` to `filePath`.
 * @param {string | undefined} providedFilePath The path to the current configuration. Default is empty string.
 * @param {string | undefined} providedMatchBasePath The type of the current configuration. Default is the directory of `filePath` or `cwd`.
 * @returns {{matchBasePath: *, filePath: string | string, name: (string|string), type: ("config"|"ignore"|"implicit-processor"|string)}} The created context.
 */
function createContext (
  { cwd },
  providedType,
  providedName,
  providedFilePath,
  providedMatchBasePath
) {
  const filePath = providedFilePath
    ? path.resolve(cwd, providedFilePath)
    : ''
  const matchBasePath =
    (providedMatchBasePath && path.resolve(cwd, providedMatchBasePath)) ||
    (filePath && path.dirname(filePath)) ||
    cwd
  const name =
    providedName ||
    (filePath && path.relative(cwd, filePath)) ||
    ''
  const type = providedType || 'config'

  return { filePath, matchBasePath, name, type }
}

class ConfigFactory {
  constructor ({ cwd = process.cwd() } = { }) {
    this.cwd = cwd
  }

  /**
   * Load a config file.
   * @param {string} filePath The path to a config file.
   * @param {Object} [options] The options.
   * @param {string} [options.basePath] The base path to resolve relative paths in `overrides[].files`, `overrides[].excludedFiles`, and `ignorePatterns`.
   * @param {string} [options.name] The config name.
   * @returns {ExtractedConfig} Loaded config.
   */
  loadFile (filePath, { basePath, name } = {}) {
    const ctx = createContext(this, 'config', name, filePath, basePath)
    return parse(ctx.filePath)
  }

  /**
   * Load the config file on a given directory if exists.
   *
   * Why an empty config you might say? We will try to generate
   * a image based on the `dirname` and any passed cli arguments
   * and defaults, if there is a Dockerfile in the directory
   *
   * @param {string} directoryPath The path to a directory.
   * @param {Object} [options] The options.
   * @param {string} [options.basePath] The base path to resolve relative paths in `overrides[].files`, `overrides[].excludedFiles`, and `ignorePatterns`.
   * @param {string} [options.name] The config name.
   * @returns {ExtractedConfig} Loaded config. An empty `ExtractedConfig` if any config doesn't exist.
   */
  loadInDirectory (directoryPath, { basePath, name } = {}) {
    for (const filename of configFilenames) {
      const ctx = createContext(this, 'config', name, path.join(directoryPath, filename), basePath)

      if (fs.existsSync(ctx.filePath)) {
        let configData
        try {
          configData = parse(ctx.filePath)
        } catch (error) {
          if (!error || error.code !== 'ADVTR_CONFIG_FIELD_NOT_FOUND') {
            throw error
          }
        }

        if (configData) {
          return configData
        }
      }
    }
    return new parse.ExtractedConfig()
  }
}

module.exports = { ConfigFactory, createContext }
