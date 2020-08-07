const regex = /%{{(.*?)}}/g

const format = (attribute, values) => {
  return values[attribute] || ''
}

/**
 * @typedef {Object} Tag
 *
 * @property {string} image The image name
 * @property {string} tag The tag version
 * */

/**
 * @typedef {Object} GithubTagType
 *
 * @property {string} repo The repository name
 * @property {string} username The github username
 *
 * @typedef {Tag & GithubTagType} GithubTag
 * */

/**
 * @typedef {Object} DockerTagType
 *
 * @property {string} username The github username
 *
 * @typedef {Tag & DockerTagType} DockerTag
 * */

/**
 * This is the parsed registry value
 *
 * Here we can create the required tags when needed
 * using the format
 *
 * */
class Registry {
  /**
   * @param {string} name The name of the registry
   * @param {string} uri The base URI
   * @param {string} format The format used to generate the tag uri
   * */
  constructor ({ name, uri, format }) {
    this.uri = uri
    this.name = name
    this.format = format
  }

  /**
   * Create the tag from the format
   *
   * Passing any extra cli configuration details with the
   * image, and tag we can create the tag uri
   * */
  createTag (config) {
    return this.format.replace(regex, (...match) => format(match[1], {
      ...this, ...config
    }))
  }
}

/**
 * The standard Docker registry
 *
 * Here we preset the format to handle
 * the lack of a URI
 * */
class Docker extends Registry {
  constructor () {
    super({
      name: 'docker',
      uri: undefined,
      format: '%{{username}}/%{{image}}:%{{tag}}'
    })

    this.standard = true
  }

  /**
   * Create the tag from the format
   *
   * Passing any extra cli configuration details with the
   * image, and tag we can create the tag uri
   *
   * @param {DockerTag} config Any options not saved by the registry
   * */
  createTag (config) {
    if (!config.username) throw TypeError('Invalid arguments')
    return super.createTag(config)
  }
}

/**
 * The standard Github registry
 *
 * The URI is defaulted to the current docker registry
 * uri.
 * */
class Github extends Registry {
  constructor () {
    super({
      name: 'github',
      uri: 'docker.pkg.github.com',
      format: '%{{uri}}/%{{username}}/%{{repo}}/%{{image}}:%{{tag}}'
    })

    this.standard = true
  }

  /**
   * Create the tag from the format
   *
   * Passing any extra cli configuration details with the
   * image, and tag we can create the tag uri
   *
   * @param {GithubTag} config Any options not saved by the registry
   * */
  createTag (config) {
    if (!config.repo || !config.username) throw TypeError('Invalid arguments')
    return super.createTag(config)
  }
}

class Custom extends Registry {
  /**
   * @param {string} name The name of the registry
   * @param {string} uri The base URI
   * @param {string} [format] The format used to generate the tag uri
   * */
  constructor (name, uri, format = '%{{uri}}/%{{username}}/%{{image}}:%{{tag}}') {
    super({
      name,
      uri,
      format
    })

    this.standard = false
  }
}

module.exports = {
  Docker,
  Github,
  Custom
}
