const fs = require('fs')

/**
 *
 * Convenience wrapper for synchronously reading file contents.
 * @param {string} filePath The filename to read.
 * @returns {string} The file contents, with the BOM removed.
 * @private
 */
function readFile (filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/^\ufeff/u, '')
}

module.exports = {
  readFile
}
