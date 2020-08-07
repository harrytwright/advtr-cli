'use strict'

require('mocha')

const fs = require('../../../_utils/fs')

const os = require('os')
const path = require('path')

const { assert } = require('chai')

const readJSON = require('../../../../lib/engine/parse/json')

const tempDir = path.join(os.tmpdir(), 'advtr/parse_json')

describe('Parse.JSON', function () {
  const files = {
    'valid/test.json': '{"hello":"world"}',
    'invalid/missing_quotation.json': '{hello: world}'
  }

  fs.defineTempFiles({
    cwd: () => (tempDir),
    files
  })

  it('should throw an error', function () {
    assert.throw(() => readJSON(path.join(tempDir, 'invalid/missing_quotation.json')))
  })

  it('should return valid json', function () {
    const data = readJSON(path.join(tempDir, 'valid/test.json'))
    assert.deepStrictEqual(data, { hello: 'world' })
  })
})
