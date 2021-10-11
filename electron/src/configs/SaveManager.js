const path = require('path');
const { writeObjectJSON } = require('../../UtilsFileIO');
const { log, LogLevel, OutputManager } = require('../../OutputManager');

class SaveManager {
  log = (value, level = LogLevel.LOG) => log('SaveManager', value, level);

  // Save timer in ms.
  static saveTimer = 1500;

  static saveQueue = [];

  /**
   * Adds to queue wrting fileData to filePath as an object json.
   * @param {string} filePath File path to write to.
   * @param {object} fileData File data to write.
   */
  addToQueue(filePath, fileData) {
    const currentIndex = SaveManager.saveQueue.findIndex(
      (entry) => entry.filePath === filePath
    );

    if (currentIndex === -1) {
      SaveManager.saveQueue.push({
        filePath,
        fileData,
        saveTimeout: setTimeout(() => {
          this.saveFile(filePath, fileData);
        }, SaveManager.saveTimer)
      });

      this.log(
        `${path.basename(filePath)} added to save queue`,
        LogLevel.DEBUG
      );
    } else {
      clearTimeout(SaveManager.saveQueue[currentIndex].saveTimeout);
      SaveManager.saveQueue[currentIndex].saveTimeout = setTimeout(() => {
        this.saveFile(filePath, fileData);
        SaveManager.saveQueue[currentIndex].saveTimeout = null;
      }, SaveManager.saveTimer);
    }
  }

  /**
   * Saves data to give file path as an object JSON.
   * @param {string} filePath File path to save fileData to as object JSON.
   * @param {object} fileData Data to save as JSON.
   * @param {number} attempt Attempt counter. Will try to save up to three times.
   */
  async saveFile(filePath, fileData, attempt = 0) {
    if (attempt > 2) {
      this.log(`Failed to save file! File: ${filePath}`);
      return;
    }

    await writeObjectJSON(fileData, filePath)
      .then(() => {
        this.log(`${path.basename(filePath)} saved to file`, LogLevel.DEBUG);
      })
      .catch(async () => {
        this.log(`Retrying to save file! File: ${filePath}`);
        await this.saveFile(filePath, fileData, attempt + 1);
      });
  }

  /**
   * Save everything in queue immediately.
   * @param skipLog Flag whether to skip saving the app log file. Default: false.
   */
  async forceSave(skipLog = false) {
    const savePromises = [];
    SaveManager.saveQueue.forEach((saveEntry) => {
      if (saveEntry.saveTimeout != null) {
        // console.log('Saving unsaved queued files early!', LogLevel.DEBUG);
        clearTimeout(saveEntry.saveTimeout);
        savePromises.push(
          this.saveFile(saveEntry.filePath, saveEntry.fileData)
        );
      }
    });

    if (!skipLog) {
      savePromises.push(OutputManager.writeLogFile());
    }

    if (savePromises.length > 0) {
      return Promise.all(savePromises);
    }

    return null;
  }
}

module.exports = { SaveManager };
