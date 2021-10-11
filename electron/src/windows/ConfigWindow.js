const { BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

const { LogLevel, log } = require('../../OutputManager');

const inDev = process.env.APP_ENV === 'development';

class ConfigWindow {
  log = (value, level = LogLevel.LOG) => log('ConfigWindow', value, level);

  window = null;

  async openWindow(mainWindow) {
    // Bring to focus currently opened config window.
    if (this.window != null) {
      this.window.focus();
      return;
    }

    // create new window
    this.window = new BrowserWindow({
      width: 600,
      minWidth: 600,
      height: 600,
      minHeight: 600,
      backgroundColor: '#121212',
      show: true,
      parent: mainWindow,
      modal: true,
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
        ? `${process.env.ELECTRON_START_URL}/#/config`
        : url.format({
            pathname: path.join(__dirname, '../../../index.html'),
            hash: '/config',
            protocol: 'file:',
            slashes: true
          })
    );

    // garbage collection handle
    this.window.on('close', () => {
      // mainWindow.reload();
      this.window = null;
    });
  }
}

module.exports = { ConfigWindow };
