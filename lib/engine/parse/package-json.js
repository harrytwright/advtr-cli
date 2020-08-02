const loadJSONConfigFile = require('./json')

/**
 * Loads a configuration from a package.json file.
 * @param {string} filePath The filename to load.
 * @returns {ConfigData} The configuration object from the file.
 * @throws {Error} If the file cannot be read.
 * @private
 */
function loadPackageJSONConfigFile(filePath) {
  try {
    const packageData = loadJSONConfigFile(filePath);

    if (!Object.hasOwnProperty.call(packageData, "advtrConfig")) {
      throw Object.assign(
        new Error("package.json file doesn't have 'advtrConfig' field."),
        { code: "ADVTR_CONFIG_FIELD_NOT_FOUND" }
      );
    }

    return packageData.advtrConfig;
  } catch (e) {
    e.message = `Cannot read config file: ${filePath}\nError: ${e.message}`;
    throw e;
  }
}

module.exports = loadPackageJSONConfigFile
