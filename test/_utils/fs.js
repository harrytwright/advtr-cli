/**
 * Here we write all our files to a separate location
 *
 * Nothing complicated, just create the files and when
 * the tests exit, clean up like good children
 * */

const fs = require('fs')
const path = require('path')

const rmdir = require('rimraf')

const _locations = new Set()

/**
 * Delete any dir that has been generated
 * */
process.on('exit', code => {
  _locations.forEach((dir) => {
    rmdir.sync(dir)
  })

  process.exit(code)
})

/**
 * @typedef {Object} Files
 */

module.exports.defineTempFiles = ({ cwd = process.cwd, files = {} } = {}) => {
  fs.mkdirSync(cwd(), { recursive: true })
  _locations.add(cwd());

  (function initFiles (directoryPath, definition) {
    for (const [filename, content] of Object.entries(definition)) {
      const filePath = path.resolve(directoryPath, filename)
      const parentPath = path.dirname(filePath)

      if (typeof content === 'object') {
        initFiles(filePath, content)
      } else if (typeof content === 'string') {
        if (!fs.existsSync(parentPath)) {
          fs.mkdirSync(parentPath, { recursive: true })
        }
        fs.writeFileSync(filePath, content)
      } else {
        throw new Error(`Invalid content: ${typeof content}`)
      }
    }
  }(cwd(), files))
}
