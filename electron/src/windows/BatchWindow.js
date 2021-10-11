const { BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

const { channels } = require('../../../src/shared/constants');

const { LogLevel, log } = require('../../OutputManager');
const { UtilsFileIO } = require('../../UtilsFileIO');
const { Phos } = require('../music-builder/Phos');

const inDev = process.env.APP_ENV === 'development';

class BatchWindow {
  log = (value, level = LogLevel.LOG) => log('BatchWindow', value, level);

  window = null;

  openWindow() {
    // create new window
    this.window = new BrowserWindow({
      width: 600,
      minWidth: 600,
      height: 800,
      minHeight: 800,
      backgroundColor: '#121212',
      show: false,
      icon: path.join(__dirname, '../../icon.ico'),
      webPreferences: {
        preload: path.join(__dirname, '../../preload.js')
      }
    });

    this.window.setMenuBarVisibility(false);

    // load html into window
    // couldn't use a constant to create the "url" in prod, __dirname would be undefined, probably something with webpack/nodejs
    this.window.loadURL(
      inDev
        ? `${process.env.ELECTRON_START_URL}/#/batchsettings`
        : url.format({
            pathname: path.join(__dirname, '../../../index.html'),
            hash: '/batchsettings',
            protocol: 'file:',
            slashes: true
          })
    );

    this.window.on('ready-to-show', () => {
      this.window.show();
      this.window.focus();

      this.initBatch();
    });

    // garbage collection handle
    this.window.on('close', () => {
      this.window = null;
    });
  }

  async initBatch() {
    // prompt for folder to batch convert
    const batchFolder = await UtilsFileIO.selectFolderDialog(
      this.window,
      'Select Folder to Batch Convert...'
    );

    // exit batch window if no folder was selected
    if (batchFolder == null) {
      this.window.close();
      return;
    }

    const batchConvert = await BatchWindow.convertFolderSongs(batchFolder);
    // exit batch window if conversion failed
    if (batchConvert == null) {
      this.window.close();
      return;
    }

    const { encodedPath, encodedFormat } = batchConvert;

    const convertedFiles = await UtilsFileIO.filterFolderFiles(encodedPath, [
      encodedFormat
    ]).catch((err) => {
      this.log(err, LogLevel.ERROR);
      this.log('Failed to get folder files!', LogLevel.ERROR);
      return null;
    });

    if (convertedFiles[encodedFormat] == null) {
      this.window.close();
      return;
    }

    if (convertedFiles[encodedFormat].length < 1) {
      this.log('No files were encoded', LogLevel.INFO);
      this.window.close();
      return;
    }

    await this.sendSongs(convertedFiles[encodedFormat]);
  }

  async sendSongs(files) {
    const songs = files.map((file) => {
      const songObject = {
        id: file,
        isEnabled: true,
        name: file,
        category: 'undefined',
        originalFile: null,
        replacementFilePath: file,
        loopStartSample: 0,
        loopEndSample: 0,
        waveIndex: '0',
        uwuIndex: 0
      };

      return songObject;
    });

    // retrieve existing loop settings
    const loopSettingsPromises = songs.map(async (song, index) => {
      const songLoopFile = `${song.replacementFilePath}.p4g`;
      return UtilsFileIO.parseObjectJSON(songLoopFile, true)
        .then((loop) => {
          songs[index].loopStartSample = loop.settings.loopstart;
          songs[index].loopEndSample = loop.settings.loopend;
        })
        .catch(() => {});
    });

    if (loopSettingsPromises.length > 0) {
      await Promise.all(loopSettingsPromises).then(() => {
        this.log('Loaded previous loop settings', LogLevel.DEBUG);
      });
    }

    this.window.webContents.send(channels.BATCH_BUILD, {
      songs
    });
  }

  /**
   * Converts all supported songs in specified folder to game's modding format. On success returns the
   * path to the converted files, null otherwise.
   * @param {string} folder Folder directory containing songs to convert.
   * @returns {string} Path to converted files on success, null otherwise.
   */
  static async convertFolderSongs(folder) {
    const batchResult = await Phos.batch(folder);

    const { success, encodedFormat } = batchResult;

    if (success) {
      return {
        encodedPath: path.join(folder, '/encoded'),
        encodedFormat
      };
    }

    return null;
  }
}

module.exports = { BatchWindow };
