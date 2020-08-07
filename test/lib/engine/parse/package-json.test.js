'use strict'

require('mocha')

const fs = require('../../../_utils/fs')

const os = require('os')
const path = require('path')

const { assert } = require('chai')

const readJSON = require('../../../../lib/engine/parse/package-json')

const tempDir = path.join(os.tmpdir(), 'advtr/parse_package_json')

/**
 * Future, may look at running `npm init -y` inside both
 * locations and adding a valid `advtrConfig` in one
 * so it's more realistic
 * */
describe('Parse.PackageJSON', function () {
  const files = {
    'valid/package.json': '{"hello":"world", "advtrConfig": { }}',
    'invalid/package.json': '{hello: world}'
  }

  fs.defineTempFiles({
    cwd: () => (tempDir),
    files
  })

  it('should throw an error', function () {
    assert.throw(() => readJSON(path.join(tempDir, 'invalid/package.json')))
  })

  it('should return valid json', function () {
    const data = readJSON(path.join(tempDir, 'valid/package.json'))
    assert.deepStrictEqual(data, { })
  })
})
