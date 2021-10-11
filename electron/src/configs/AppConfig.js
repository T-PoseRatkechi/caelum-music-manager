const path = require('path');

const {
  writeObjectJSON,
  parseObjectJSON,
  pathDidntExist
} = require('../../UtilsFileIO');

const { settingsFolderDir } = require('../../AppDirectories');
const { log, LogLevel } = require('../../OutputManager');
const { defaultConfig } = require('./Defaults');

const appConfigPath = path.join(settingsFolderDir, '/app-config.json');

class AppConfig {
  log = (value, level = LogLevel.LOG) => log('AppConfig', value, level);

  appConfig = null;

  async init() {
    return this.loadAppConfig();
  }

  /**
   * Loads the app settings. Will create a new default app settings if missing.
   * @returns Boolean indicating whether the app settings was loaded or created successfully.
   */
  async loadAppConfig() {
    // Load saved app config file.
    const config = await parseObjectJSON(appConfigPath, true).catch(
      async (err) => {
        // App config did not exist.
        if (pathDidntExist(err)) {
          // Create new app config.
          const newConfigSuccess = await writeObjectJSON(
            defaultConfig,
            appConfigPath
          )
            .then(() => true)
            .catch(() => false);

          // Return default config if write success.
          if (newConfigSuccess) {
            this.log('Created new app config');
            return defaultConfig;
          }

          this.log('Failed to create new app config!', LogLevel.ERROR);
        }

        return null;
      }
    );

    if (config != null) {
      this.appConfig = config;
      // Check if app config is valid.
      if (this.validateConfig()) {
        this.log('App config loaded', LogLevel.DEBUG);
        return true;
      }

      // Loaded app config was invalid. Create new default app config.
      const newConfigSuccess = await writeObjectJSON(
        defaultConfig,
        appConfigPath
      )
        .then(() => true)
        .catch(() => false);

      // Return true if new app config created.
      if (newConfigSuccess) {
        this.appConfig = defaultConfig;
        this.log('Created new app config');
        return true;
      }
    }

    this.log('Failed to load app config!', LogLevel.ERROR);
    return false;
  }

  /**
   * Writes the current app config to file.
   * @returns Success of write.
   */
  async writeAppConfig() {
    if (this.appConfig == null) {
      this.log('Attempt to write a null app config to file!', LogLevel.ERROR);
      return false;
    }

    const writeSuccess = await writeObjectJSON(this.appConfig, appConfigPath)
      .then(() => true)
      .catch(() => false);

    if (writeSuccess) {
      this.log('App config file updated', LogLevel.DEBUG);
      return true;
    }

    this.log('Failed to write app config to file!', LogLevel.ERROR);
    return false;
  }

  /**
   * Validates that the loaded config has the required attributes.
   * @returns Boolean indicating whether the app config is valid.
   */
  validateConfig() {
    // Check if loaded app config is null.
    if (this.appConfig == null) {
      return false;
    }

    let valid = true;

    const requiredProps = ['settings', 'dependencies'];

    const appConfigKeys = Object.keys(this.appConfig);
    requiredProps.forEach((prop) => {
      if (!appConfigKeys.includes(prop)) {
        this.log(
          `Invalid app config! Missing property: ${prop}!`,
          LogLevel.ERROR
        );
        valid = false;
      }
    });

    return valid;
  }

  /**
   * Get the current app config.
   * @returns Current app config.
   */
  getConfig() {
    return this.appConfig;
  }

  /**
   * Gets all dependency paths.
   * @returns Object containing all dependency paths.
   */
  getDependencies() {
    return this.appConfig.dependencies;
  }
}

module.exports = { AppConfig, appConfigPath };
