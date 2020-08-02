'use strict'

require('mocha')

const fs = require('../../../_utils/fs')

const os = require('os')
const path = require('path')

const { assert } = require('chai')

const { ExtractedConfig, RawBuildArgument } = require('../../../../lib/engine/parse/extracted-config')

const tempDir = path.join(os.tmpdir(), 'advtr/extracted-config')

describe('Extracted-Config', function () {
  describe("'constructor()' should create an instance.", () => {
    /** @type {ExtractedConfig} */
    let config

    beforeEach(() => {
      config = new ExtractedConfig()
    })

    it("should have 'builds' property.", () => {
      assert.deepStrictEqual(config.builds, {})
    })

    it("should have 'matrices' property.", () => {
      assert.deepStrictEqual(config.matrices, [])
    })

    it("should have 'registry' property.", () => {
      // Remove github here, can be substituted later
      assert.deepStrictEqual(config.registry, { })
    })
  })

  describe("'handleBuild()' method should generate valid configuration data", () => {
    /** @type {ExtractedConfig} */
    let config

    beforeEach(() => {
      config = new ExtractedConfig()
    })

    it('should turn string build_arguments into map', function () {
      const data = { binary: { name: 'advtr-cli', build_arguments: ['NODE_ENV=env'] } }
      config.handleBuild(data)

      assert.strictEqual(config.builds.binary.buildArguments.length, 1)
      assert.deepStrictEqual(config.builds.binary.buildArguments[0], new RawBuildArgument({
        argument: 'NODE_ENV',
        option: 'env'
      }).validate())
    })

    it('should turn keep build_arguments as map', function () {
      const data = { binary: { name: 'advtr-cli', build_arguments: [{ argument: 'NODE_ENV', option: 'env' }] } }
      config.handleBuild(data)

      assert.strictEqual(config.builds.binary.buildArguments.length, 1)
      assert.deepStrictEqual(config.builds.binary.buildArguments[0], new RawBuildArgument({
        argument: 'NODE_ENV',
        option: 'env'
      }).validate())
    })

    it('should throw an error on invalid build argument', function () {
      const data = { binary: { name: 'advtr-cli', build_arguments: [{ argument: 'NODE_ENV' }] } }
      assert.throw(() => config.handleBuild(data))
    });

    it('should set name to build if no name is passed', function () {
      const data = { binary: { } }
      config.handleBuild(data)

      assert.strictEqual(config.builds.binary.name, 'binary')
    })

    it('should remove dockerfile if file is set', function () {
      const data = { binary: { file: tempDir } }
      config.handleBuild(data)

      assert.strictEqual(config.builds.binary.dockerfile, null)
      assert.strictEqual(config.builds.binary.file, tempDir)
    })

    it('should have a valid command inside prebuild', function () {
      const data = { binary: { prebuild: ['echo "hello world"'] } }
      config.handleBuild(data)

      assert.strictEqual(config.builds.binary.prebuild.length, 1)
    })

    it('should have a valid command inside prebuild using snake_case', function () {
      const data = { binary: { pre_build: ['echo "hello world"'] } }
      config.handleBuild(data)

      assert.strictEqual(config.builds.binary.prebuild.length, 1)
    })

    it('should prioritise using snake_case', function () {
      const data = { binary: { pre_build: ['echo "hello world"'], prebuild: ['echo "hello world"'] } }
      config.handleBuild(data)

      assert.strictEqual(config.builds.binary.prebuild.length, 1)
    })
  })

  describe("'handleMatrices()' method should generate valid matrix data", () => {
    /** @type {ExtractedConfig} */
    let config

    beforeEach(() => {
      config = new ExtractedConfig()
    })

    it('should turn key value map into array', function () {
      const data = { canary: { file: tempDir }, latest: { file: process.cwd() } }
      config.handleMatrices(data)

      assert.strictEqual(config.matrices.length, 2)
      assert.deepStrictEqual(config.matrices[0], {
        tag: 'canary',
        file: tempDir
      })
    })

    it('should generate the same output from array', function () {
      const data = [{ tag: 'canary', file: tempDir }, { tag: 'latest', file: process.cwd() }]
      config.handleMatrices(data)

      assert.strictEqual(config.matrices.length, 2)
      assert.deepStrictEqual(config.matrices[0], {
        tag: 'canary',
        file: tempDir
      })
    })

    it('should turn string build_arguments into map', function () {
      const data = { binary: { build_arguments: ['NODE_ENV=env'] } }
      config.handleMatrices(data)

      assert.strictEqual(config.matrices[0].buildArguments.size, 1)
      assert.deepStrictEqual(config.matrices[0].buildArguments, new Map([["NODE_ENV", "env"]]))
    })
  })

  describe("'handleRegistry()' method should generate valid matrix data", () => {
    /** @type {ExtractedConfig} */
    let config

    beforeEach(() => {
      config = new ExtractedConfig()
    })

    it('should return the basic docker registry', function () {
      let data = { docker: null }
      config.handleRegistry(data)

      assert.deepStrictEqual(config.registry, { docker: true })
    });

    it('should return the github registry', function () {
      let data = { github: { uri: 'docker.pkg.github.com' } }
      config.handleRegistry(data)

      assert.deepStrictEqual(config.registry, data)
    });

    it('should return the github registry when url is passed', function () {
      let data = { github: { url: 'docker.pkg.github.com' } }
      config.handleRegistry(data)

      assert.deepStrictEqual(config.registry, {
        github: { uri: 'docker.pkg.github.com' }
      })
    });

    it('should throw an error on an invalid registry', function () {
      let data = { github: { http: 'docker.pkg.github.com' } }
      assert.throw(() => config.handleRegistry(data))
    });
  })
})
