const path = require('path')

const loadYAML = require('./yaml')
const loadJSON = require('./json')
const loadPackageJSON = require('./package-json')
const { ExtractedConfig } = require('./extracted-config')

/**
 * Loads a configuration file regardless of the source. Inspects the file path
 * to determine the correctly way to load the config file.
 * @param {string} filePath The path to the configuration.
 * @returns {ConfigData|null} The configuration information.
 * @private
 */
function loadConfigFile(filePath) {
  switch (path.extname(filePath)) {
    case '.json':
      if (path.basename(filePath) === "package.json") {
        return loadPackageJSON(filePath);
      }
      return loadJSON(filePath);

    case '.yaml':
    case '.yml':
    default:
      return loadYAML(filePath)
  }
}

module.exports = (file) => {
  let data = loadConfigFile(file)

  let configuration = new ExtractedConfig()

  Object.keys(data).forEach((key) => {
    switch (key) {
      case 'services': configuration.handleBuild(data[key]); break;
      case 'matrix': configuration.handleMatrices(data[key]); break;
      case 'registry': configuration.handleRegistry(data[key]); break;
    }
  })

  return configuration
}

module.exports.ExtractedConfig = ExtractedConfig
