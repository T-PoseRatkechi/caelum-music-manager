const path = require('path');

const inDev = process.env.APP_ENV === 'development';
const appDir = process.env.PORTABLE_EXECUTABLE_DIR;

// app directories
// settings folder
const settingsFolderDir = inDev
  ? path.join(__dirname, '/settings')
  : path.join(appDir, '/settings');

// loop data folder
const loopDataFolderDir = path.join(settingsFolderDir, '/loop-data');

// app music build folder
const buildFolderDir = inDev
  ? path.join(__dirname, '/music-build')
  : path.join(appDir, '/music-build');

// app tools folder
const dependenciesFolderDir = inDev
  ? path.join(__dirname, '/dependencies')
  : path.join(appDir, '/dependencies');

// p4g cache folder
// const cacheFolderP4G = path.join(settingsFolderDir, `/${Game.P4G}/cache`);

module.exports = {
  settingsFolderDir,
  loopDataFolderDir,
  buildFolderDir,
  dependenciesFolderDir
};
