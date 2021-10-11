const { BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const url = require('url');

const { OutputManager, LogLevel, log } = require('../../OutputManager');

const { MusicBuilder } = require('../music-builder/MusicBuilder');
const { MenuBar } = require('../../MenuBar');
const { Phos } = require('../music-builder/Phos');
const { channels, appEvents } = require('../../../src/shared/constants');

// Config manager.
const ConfigManager = require('../configs/ConfigManager');

// App constants.
const { Game } = require('../AppConstants');

// const inDev = process.env.APP_ENV === 'development';

class MainWindow {
  log = (value, level = LogLevel.LOG) => log('MainWindow', value, level);

  window = null;

  musicBuilder = null;

  hasFinishedLoading = false;

  canMainQuit = false;

  constructor() {
    this.musicBuilder = new MusicBuilder();

    this.registerEvents();
  }

  /**
   * Registers main window events.
   */
  registerEvents() {
    // Register window reload listener.
    ipcMain.on(channels.RELOAD, () => {
      this.window.reload();
    });

    // Register play song listener.
    ipcMain.on(channels.PLAY_SONG, (e, arg) => {
      const { source, filePath } = arg;
      this.playSong(source, filePath);
    });

    ipcMain.on(appEvents.app.STATUS_UPDATE, (e, args) => {
      const { status } = args;

      // App should only be sending ready status.
      if (status !== 'READY') {
        return;
      }

      // Begin loading app stuff if not already done so.
      if (!this.hasFinishedLoading) {
        this.initApp();
        return;
      }

      // Send back that app has already successfully loaded.
      // Hopefully stops refreshes from being stuck on loading.
      e.sender.send(appEvents.app.STATUS_UPDATE, {
        status: 'SUCCESS',
        message: 'Caelum Music Manager'
      });
    });
  }

  openWindow() {
    // Url to index file.
    const startUrl =
      process.env.ELECTRON_START_URL ||
      url.format({
        pathname: path.join(__dirname, '../../../index.html'),
        protocol: 'file:',
        slashes: true
      });

    // Only allow one instance of main window, bringing to focus if
    // try to open another.
    if (this.window != null) {
      this.window.focus();
      return;
    }

    // Create new window.
    this.window = new BrowserWindow({
      width: 1300,
      height: 800,
      minWidth: 1300,
      minHeight: 800,
      icon: path.join(__dirname, '../../icon.ico'),
      backgroundColor: '#121212',
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '../../preload.js')
      }
    });

    // Build menu bar.
    const mainMenu = Menu.buildFromTemplate(
      MenuBar.getMenuTemplate('main', this.window)
    );

    // Insert menu.
    Menu.setApplicationMenu(mainMenu);

    // Connect output manager to main window.
    OutputManager.init(this.window);

    // Load index.html
    this.window.loadURL(startUrl);

    // Hide window until front end rendered to stop white flashing.
    this.window.on('ready-to-show', () => {
      this.window.show();
      this.window.focus();
    });

    // Save current app config data to file when trying to close.
    this.window.on('close', async (e) => {
      if (!this.canMainQuit) {
        e.preventDefault();
        await ConfigManager.saveManager.forceSave().catch(() => {
          this.canMainQuit = true;
        });

        this.canMainQuit = true;
        this.window.close();
      }
    });

    // Close window.
    this.window.on('closed', () => {
      this.window = null;
    });
  }

  // Initialize app stuff.
  async initApp() {
    // Init config manager.
    this.window.webContents.send(appEvents.app.STATUS_UPDATE, {
      status: 'STATUS',
      message: 'Loading Config Files...'
    });

    const configManagerLoaded = await ConfigManager.init(this.window);

    if (!configManagerLoaded) {
      this.window.webContents.send(appEvents.app.STATUS_UPDATE, {
        status: 'ERROR',
        message:
          'Config Manager failed to start! Check app.log in the settings folder for more details!'
      });

      return;
    }

    // Init music builder.
    this.window.webContents.send(appEvents.app.STATUS_UPDATE, {
      status: 'STATUS',
      message: 'Loading Music Builder...'
    });

    this.musicBuilder.init();

    // Set debug messages flag.
    OutputManager.setShowDebug(
      ConfigManager.appConfig.getConfig().settings.showDebugMessages
    );

    this.window.webContents.send(appEvents.app.STATUS_UPDATE, {
      status: 'SUCCESS',
      message: 'Caelum Music Manager'
    });

    // Set that app has finished loading successfully.
    this.hasFinishedLoading = true;
  }

  /**
   * Plays the song given by filePath. The file played depends on the source, with original songs
   * having their filePath prepended with the expected phos extracted path.
   * @param {string} source Source of file to play. Available sources: replacement file and original file.
   * @param {string} filePath The path of the file.
   */
  async playSong(source, filePath) {
    const audioTypes = ['.wav', '.raw', '.mp3', '.flac', '.ogg'];

    const selectedGame = ConfigManager.gamesConfig.getCurrentGame();
    const { phosPath } = ConfigManager.appConfig.getDependencies();

    if (audioTypes.findIndex((types) => types === path.extname(filePath)) < 0) {
      this.log(
        `${path.basename(filePath)}: Can't play song, unsupported audio type!`,
        LogLevel.WARN
      );
      return;
    }

    switch (source) {
      case 'replacement':
        shell.openPath(filePath);
        break;
      case 'original':
        switch (selectedGame) {
          case Game.P4G:
            shell
              .openPath(
                path.join(
                  path.dirname(phosPath),
                  `/${selectedGame}/original-songs/${filePath}`
                )
              )
              .then(async (res) => {
                if (res === 'Failed to open path') {
                  this.log('Original music requires extracting', LogLevel.INFO);
                  await Phos.extract();
                }
              });
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }
  }
}

module.exports = { MainWindow };
