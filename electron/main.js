const { app, ipcMain, dialog } = require('electron');

const { dialogRequest } = require('../src/shared/constants');

// output manager
const { OutputManager, LogLevel } = require('./OutputManager');

const { MainWindow } = require('./src/windows/MainWindow');

const mainWindow = new MainWindow();

function output(...outputArgs) {
  if (OutputManager.output != null && outputArgs.length > 0) {
    const appendedOutput = `(Main) ${outputArgs[0]}`;
    OutputManager.output.apply(null, [appendedOutput, ...outputArgs.slice(1)]);
  }
}

app.on('ready', () => {
  mainWindow.openWindow();
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow.window === null) {
    mainWindow.openWindow();
  }
});

// open file select window
ipcMain.handle(dialogRequest.FILE, async (e, args) => {
  const { filename, filetypes, windowTitle } = args;

  // prompt to select file
  const selectedFile = await dialog.showOpenDialog(mainWindow.window, {
    title: `${windowTitle}`,
    properties: ['openFile'],
    filters: [{ name: filename, extensions: filetypes }]
  });

  // exit if selection cancelled
  if (selectedFile.canceled) {
    output('File selection cancelled', LogLevel.DEBUG);
    return null;
  }

  output(`File selected: ${selectedFile.filePaths[0]}`, LogLevel.DEBUG);
  return selectedFile.filePaths[0];
});

// open folder select window
ipcMain.handle(dialogRequest.FOLDER, async (e, args) => {
  const { windowTitle } = args;

  // prompt to select file
  const selectedFolder = await dialog.showOpenDialog(mainWindow.window, {
    title: `${windowTitle}`,
    properties: ['openDirectory']
  });

  // exit if selection cancelled
  if (selectedFolder.canceled) {
    output('File selection cancelled', LogLevel.DEBUG);
    return null;
  }

  output(`Folder selected: ${selectedFolder.filePaths[0]}`, LogLevel.DEBUG);
  return selectedFolder.filePaths[0];
});
