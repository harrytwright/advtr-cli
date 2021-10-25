const { readFile } = require('./shared')

/**
 * Loads a YAML configuration from a file.
 *
 * @param {string} filePath The filename to load.
 * @returns {ConfigData} The configuration object from the file.
 * @throws {Error} If the file cannot be read.
 * @private
 */
function loadYAMLConfigFile (filePath) {
  // lazy load YAML to improve performance when not used
  const yaml = require('js-yaml')

  try {
    // empty YAML file can be null, so always use
    return yaml.load(readFile(filePath)) || {}
  } catch (e) {
    e.message = `Cannot read config file: ${filePath}\nError: ${e.message}`
    throw e
  }
}

module.exports = loadYAMLConfigFile
