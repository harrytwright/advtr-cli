'use strict'

require('mocha')

const fs = require('../../../_utils/fs')

const os = require('os')
const path = require('path')

const { assert } = require('chai')

const readYAML = require('../../../../lib/engine/parse/yaml')

const tempDir = path.join(os.tmpdir(), 'advtr/parse_yaml')

describe('Parse.YAML', function () {
  const files = {
    'valid/test.yml': 'registry:\n  docker:',
    'valid/empty.yml': '',
    'invalid/test.yml': 'registry:\n  - docker:\n    hello:\n  docker:'
  }

  fs.defineTempFiles({
    cwd: () => (tempDir),
    files
  })

  it('should throw an error', function () {
    assert.throw(() => readYAML(path.join(tempDir, 'invalid/test.yml')))
  })

  it('should return valid json', function () {
    const data = readYAML(path.join(tempDir, 'valid/test.yml'))
    assert.deepStrictEqual(data, { registry: { docker: null } })
  })

  it('should return empty json', function () {
    const data = readYAML(path.join(tempDir, 'valid/empty.yml'))
    assert.deepStrictEqual(data, { })
  })
})
