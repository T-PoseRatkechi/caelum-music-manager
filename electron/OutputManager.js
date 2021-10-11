/**
 * Enum of log levels.
 * @readonly
 */
const LogLevel = {
  INFO: 'INFO',
  ERROR: 'ERROR',
  LOG: 'LOG ',
  WARN: 'WARNING',
  DEBUG: 'DEBUG',
  NONE: 'NONE'
};

const path = require('path');
const { promises: fs } = require('fs');

const { ipcMain } = require('electron');
const { channels } = require('../src/shared/constants');

const { settingsFolderDir } = require('./AppDirectories');

class OutputManager {
  static mainWindow = null;

  static frontOutputReady = false;

  static showDebug = false;

  static init(mainWindow) {
    OutputManager.mainWindow = mainWindow;
    OutputManager.registerListeners();
  }

  static registerListeners() {
    ipcMain.once(channels.OUTPUT_BOX, () => {
      OutputManager.frontOutputReady = true;
      OutputManager.log('OutputManager', 'Front output ready', LogLevel.DEBUG);
    });

    OutputManager.log('OutputManager', 'Registered events', LogLevel.DEBUG);
  }

  /**
   *  Set whether to display debug messages in front-end.
   *  @param {boolean} flag Setting to set.
   */
  static setShowDebug(flag) {
    OutputManager.showDebug = flag;
  }

  /**
   *  Get whether to display debug messages in front-end.
   *  @param {boolean} flag Setting to set.
   */
  static getShowDebug() {
    return OutputManager.showDebug;
  }

  /**
   * Outputs value to console as well as front-end if available and onlyDev is false.
   * @param {*} value Value to output.
   * @param {LogLevel} level Logging level of output.
   */
  static output(value, level = LogLevel.LOG) {
    if (OutputManager.frontOutputReady && OutputManager.mainWindow) {
      if (
        level !== LogLevel.DEBUG ||
        (level === LogLevel.DEBUG && OutputManager.showDebug)
      ) {
        const append = level === LogLevel.NONE ? '' : `[${level}]`;
        OutputManager.mainWindow.webContents.send(channels.OUTPUT_BOX, {
          message: `${append} ${value}`
        });
      }
    } else {
      /* eslint-disable */
      console.log(`Front output not ready...\n${`${level}: ${value}`}`);
      /* eslint-disable */
    }
  }

  static logHistory = [];

  // Container for log messages made before output box was ready.
  static beforeReadyLogs = [];

  /**
   * Logs value to console as well as front-end if available and onlyDev is false.
   * @param {*} caller Class that called log. Used as bracket name.
   * @param {*} value Value to output.
   * @param {LogLevel} level Logging level of output.
   */
  static log(caller, value, level = LogLevel.LOG) {
    OutputManager.logHistory.push(`[${level}] (${caller}) ${value}`);

    // Send log messages to front end if possible.
    if (OutputManager.frontOutputReady && OutputManager.mainWindow) {
      // Display earlier logs.
      while (OutputManager.beforeReadyLogs.length > 0) {
        // Get log values.
        const { caller, value, level } = OutputManager.beforeReadyLogs.shift();

        // Filter out debug messages if not set to be displayed.
        if (
          level !== LogLevel.DEBUG ||
          (level === LogLevel.DEBUG && OutputManager.showDebug)
        ) {
          // Send log message to front end.
          OutputManager.mainWindow.webContents.send(channels.OUTPUT_BOX, {
            message: `[${level}] (${caller}) ${value}`
          });
        }
      }

      // Filter out debug messages if not set to be displayed.
      if (
        level !== LogLevel.DEBUG ||
        (level === LogLevel.DEBUG && OutputManager.showDebug)
      ) {
        // Handle prepending the correct string.
        const append = level === LogLevel.NONE ? '' : `[${level}] (${caller}) `;

        // Send log message to front end.
        OutputManager.mainWindow.webContents.send(channels.OUTPUT_BOX, {
          message: `${append}${value}`
        });
      }
    } else {
      /* eslint-disable */
      // Log message to regular console if front end not ready.
      console.log(`[${level}] (${caller}) ${value}`);
      // Add log message to before ready container to be sent front end when ready.
      OutputManager.beforeReadyLogs.push({ caller, value, level });
      /* eslint-disable */
    }
  }

  static async writeLogFile() {
    return fs
      .writeFile(
        path.join(settingsFolderDir, '/app.log'),
        OutputManager.logHistory.join('\n'),
        { encoding: 'utf8', flag: 'w' }
      )
      .catch((err) => {
        console.log(err);
      });
  }
}

module.exports = { OutputManager, LogLevel, log: OutputManager.log };
