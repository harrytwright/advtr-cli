const stripComments = require('strip-json-comments')

const { readFile } = require('./shared')

/**
 * Loads a JSON configuration from a file.
 * @param {string} filePath The filename to load.
 * @returns {ConfigData} The configuration object from the file.
 * @throws {Error} If the file cannot be read.
 * @private
 */
function loadJSONConfigFile (filePath) {
  try {
    return JSON.parse(stripComments(readFile(filePath)))
  } catch (e) {
    e.message = `Cannot read config file: ${filePath}\nError: ${e.message}`
    e.path = filePath
    throw e
  }
}

module.exports = loadJSONConfigFile
