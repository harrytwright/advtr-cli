const os = require('os')

const { exec } = require('child_process')

module.exports.username = os.userInfo().username

module.exports.git = function (cb) {
  exec('basename -s .git `git config --get remote.origin.url`', (er, output) => {
    if (er) return cb(er)
    return cb(null, output.trim())
  })
}
