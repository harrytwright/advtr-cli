"use strict";

require('mocha')

const fs = require('../../_utils/fs')

const os = require('os')
const path = require("path");

const { assert } = require("chai")

const { ConfigFactory } = require('../../../lib/engine/config')

const tempDir = path.join(os.tmpdir(), "advtr/config-factory");

describe('ConfigFactory', function () {

  describe('loadFile', function () {

    const tmp = path.join(tempDir, './loadFile')

    const files = {
      "yml/.advtrc.yml": "version: '1.0'\nservices:\n  binary:\n    name: advtr-cli",
      "yaml/.advtrc.yaml": "version: '1.0'\nservices:\n  binary:\n    name: advtr-cli",
      "json/.advtrc.json": '{"services": { "binary": { "name": "advtr-cli" }}}',
      "package-json/package.json": '{"advtrConfig": {"services": { "binary": { "name": "advtr-cli" }}}}',
      "default/.advtrc": "version: '1.0'\nservices:\n  binary:\n    name: advtr-cli"
    }

    fs.defineTempFiles({
      cwd: () => (tmp),
      files: {
        ...files,
        "package-json-no-config/package.json": "{ \"name\": \"foo\" }"
      }
    })

    /** @type {ConfigFactory} */
    let factory;

    beforeEach(() => {
      factory = new ConfigFactory( { cwd: tmp });
    });

    it("should throw an error if 'filePath' is null.", () => {
      assert.throws(() => factory.loadFile(null));
    });

    it("should throw an error if 'filePath' doesn't exist.", () => {
      assert.throws(() => factory.loadFile("non-exist"));
    });

    it("should throw an error if 'filePath' was 'package.json' and it doesn't have 'advtrConfig' field.", () => {
      assert.throws(() => factory.loadFile("package-json-no-config"))
    });

    for (const filePath of Object.keys(files)) {
      it(`should load '${filePath}' then return a valid config what contains the data of the config file.`, () => { // eslint-disable-line no-loop-func
        const config = factory.loadFile(filePath);

        assert.nestedProperty(config, 'builds.binary')
        assert.strictEqual(config.builds.binary.name, 'advtr-cli')
      });
    }


  });

  /**
   * Here we try simple things, see `test/engine/parse/extracted-config.test.js`
   * for the generation of more complicated data and failures
   * */
  describe('loadInDirectory', function () {

    const tmp = path.join(tempDir, './loadInDirectory')

    const files = {
      "yml/.advtrc.yml": "version: '1.0'\nservices:\n  binary:\n    name: advtr-cli",
      "yaml/.advtrc.yaml": "version: '1.0'\nservices:\n  binary:\n    name: advtr-cli",
      "json/.advtrc.json": '{"services": { "binary": { "name": "advtr-cli" }}}',
      "package-json/package.json": '{"advtrConfig": {"services": { "binary": { "name": "advtr-cli" }}}}',
      "default/.advtrc": "version: '1.0'\nservices:\n  binary:\n    name: advtr-cli"
    }

    fs.defineTempFiles({
      cwd: () => (tmp),
      files: {
        ...files,
        "package-json-no-config/package.json": "{ \"name\": \"foo\" }"
      }
    })

    /** @type {ConfigFactory} */
    let factory;

    beforeEach(() => {
      factory = new ConfigFactory( { cwd: tmp });
    });

    it("should throw an error if 'directoryPath' is null.", () => {
      assert.throws(() => factory.loadInDirectory(null));
    });

    it("should return a default config if the config file of 'directoryPath' doesn't exist.", () => {
      const config = factory.loadInDirectory("non-exist")
      assert.deepEqual(config.builds, {});
      assert.strictEqual(config.matrices.length, 0);
      assert.deepEqual(config.registry, { docker: true });
    });

    it("should return a default config if the config file of 'directoryPath' was package.json and it didn't have have 'advtrConfig' field.", () => {
      const config = factory.loadInDirectory("package-json-no-config")
      assert.deepEqual(config.builds, {});
      assert.strictEqual(config.matrices.length, 0);
      assert.deepEqual(config.registry, { docker: true });
    });

    for (const filePath of Object.keys(files)) {
      const directoryPath = filePath.split("/")[0];

      it(`should load '${directoryPath}' then return a valid config what contains the data of the config file for that directory.`, () => { // eslint-disable-line no-loop-func
        const config = factory.loadInDirectory(directoryPath);

        assert.nestedProperty(config, 'builds.binary')
        assert.strictEqual(config.builds.binary.name, 'advtr-cli')
      });
    }


  });
});
