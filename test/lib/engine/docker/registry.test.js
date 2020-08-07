'use strict'

require('mocha')

const BB = require('bluebird').Promise

const env = BB.promisifyAll(require('../../../_utils/env'))

const { assert } = require('chai')

const { Docker, Github, Custom } = require('../../../../lib/engine/docker/registry')

describe('Registry', function () {
  describe('docker', function () {
    let config

    before(function () {
      config = {
        username: env.username
      }
    })

    it('should create a valid docker object', function () {
      const docker = new Docker()

      assert.strictEqual(docker.standard, true)

      assert.strictEqual(docker.uri, undefined)

      assert.strictEqual(docker.name, 'docker')

      assert.strictEqual(docker.format, '%{{username}}/%{{image}}:%{{tag}}')
    })

    it('should throw an error on invalid tag config', function () {
      assert.throw(() => new Docker().createTag({}))
    })

    it('should generate a valid github tag', function () {
      const docker = new Docker().createTag({
        ...config,
        image: 'cli',
        tag: 'latest'
      })

      // Will have to get username again for any environment
      // that a default usage will not suffice
      assert.strictEqual(docker, `${env.username}/cli:latest`)
    })
  })

  describe('github', function () {
    let config

    before(async function () {
      let repo
      try {
        repo = await env.gitAsync()
      } catch (err) {
        console.warn('git: failed')
        repo = 'test-repo'
      }

      config = {
        username: env.username,
        repo
      }
    })

    it('should create a valid github object', function () {
      const github = new Github()

      assert.strictEqual(github.standard, true)

      assert.strictEqual(github.uri, 'docker.pkg.github.com')

      assert.strictEqual(github.name, 'github')

      assert.strictEqual(github.format, '%{{uri}}/%{{username}}/%{{repo}}/%{{image}}:%{{tag}}')
    })

    it('should throw an error on invalid tag config', function () {
      assert.throw(() => new Github().createTag({}))
    })

    it('should generate a valid github tag', function () {
      const github = new Github().createTag({
        ...config,
        image: 'cli',
        tag: 'latest'
      })

      // Will have to get username again for any environment
      // that a default usage will not suffice
      assert.strictEqual(github, `docker.pkg.github.com/${env.username}/advtr-cli/cli:latest`)
    })
  })

  describe('custom', function () {
    let config

    before(async function () {
      config = {
        username: env.username
      }
    })

    it('should create a valid github object', function () {
      const custom = new Custom('rsdv', 'docker.rsdv.co.uk')

      assert.strictEqual(custom.standard, false)

      assert.strictEqual(custom.name, 'rsdv')

      assert.strictEqual(custom.uri, 'docker.rsdv.co.uk')

      assert.strictEqual(custom.format, '%{{uri}}/%{{username}}/%{{image}}:%{{tag}}')
    })

    it('should generate a valid custom tag', function () {
      const custom = new Custom('rsdv', 'docker.rsdv.co.uk').createTag({
        ...config,
        image: 'cli',
        tag: 'latest'
      })

      assert.strictEqual(custom, `docker.rsdv.co.uk/${env.username}/cli:latest`)
    })

    it('should generate a valid github tag missing tag', function () {
      const custom = new Custom('rsdv', 'docker.rsdv.co.uk').createTag({
        ...config,
        image: 'cli'
      })

      assert.strictEqual(custom, `docker.rsdv.co.uk/${env.username}/cli:`)
    })
  })
})
