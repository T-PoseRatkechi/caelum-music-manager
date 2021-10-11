const { ipcMain } = require('electron');
const path = require('path');
const {
  appEvents: { config }
} = require('../../../src/shared/constants');

const { UtilsFileIO, createDirectory } = require('../../UtilsFileIO');
const MusicDataUtils = require('./MusicDataUtils');

const { Themes } = require('../AppConstants');

const {
  log: outputLog,
  LogLevel,
  OutputManager
} = require('../../OutputManager');

const AppDirectories = require('../../AppDirectories');

const { AppConfig, appConfigPath } = require('./AppConfig');
const { GamesConfig, gamesConfigPath } = require('./GamesConfig');
const { SaveManager } = require('./SaveManager');

const appConfig = new AppConfig();
const gamesConfig = new GamesConfig();
const saveManager = new SaveManager();

let mainWindow = null;
let phosGameSupport = null;

const log = (value, level = LogLevel.LOG) =>
  outputLog('ConfigManager', value, level);

async function createAppDirs() {
  await createDirectory(AppDirectories.buildFolderDir, true);
  await createDirectory(AppDirectories.dependenciesFolderDir, true);
  await createDirectory(AppDirectories.loopDataFolderDir, true);
  await createDirectory(AppDirectories.settingsFolderDir, true);
}

// Inits app settings and games config.
async function init(window) {
  mainWindow = window;

  await createAppDirs();
  const appConfigLoaded = await appConfig.init();
  const gamesConfigLoaded = await gamesConfig.init();

  // Return that init failed if either the app config or games config failed to load.
  if (!appConfigLoaded || !gamesConfigLoaded) {
    await saveManager.forceSave();
    return false;
  }

  // Load Phos's game support file.
  const { phosPath } = appConfig.getConfig().dependencies;
  if (phosPath != null) {
    const supportPath = path.join(path.dirname(phosPath), '/game-support.json');
    phosGameSupport = await UtilsFileIO.parseObjectJSON(supportPath).catch(
      () => log('Failed to load Phos support file!'),
      LogLevel.ERROR
    );
  }

  return true;
}

function getThemeCss(themeName) {
  const theme = Themes.find((themeEntry) => themeEntry.name === themeName);
  if (theme != null) {
    return theme.css;
  }

  return 'defaultDark';
}

// Handle requests for the current game's theme.
ipcMain.handle(config.request.GAME_THEME, () => {
  const currentGameTheme = gamesConfig.getGameTheme();

  const theme = Themes.find(
    (themeEntry) => themeEntry.name === currentGameTheme
  );

  if (theme != null) {
    log(
      `Sending theme - ${gamesConfig.getCurrentGame()}, Theme: ${currentGameTheme}`,
      LogLevel.DEBUG
    );

    return theme.css;
  }

  log(
    `Couldn't find theme. Sending default theme: Default Dark`,
    LogLevel.DEBUG
  );

  return 'defaultDark';
});

// Handle requests for list of available themes.
ipcMain.handle(config.request.APP_THEMES, () =>
  Themes.map((theme) => theme.name)
);

// Handle requests for current game's music data.
ipcMain.handle(config.request.MUSIC_DATA, () => {
  log(`Sending music data - ${gamesConfig.getCurrentGame()}`, LogLevel.DEBUG);
  return gamesConfig.getCurrentMusicData();
});

// Handle requests for games config.
ipcMain.handle(config.request.GAMES_CONFIG, () => {
  log('Sending games config', LogLevel.DEBUG);
  return gamesConfig.getConfig();
});

// Handle requests for app config.
ipcMain.handle(config.request.APP_CONFIG, () => {
  log('Sending app config', LogLevel.DEBUG);
  return appConfig.getConfig();
});

/**
 * Flag that music data has changed and new music data should be sent
 * too front-end and saved to file.
 */
function flagMusicDataChanged() {
  // Send updated music data to front-end.
  log('Sending new music data', LogLevel.DEBUG);
  mainWindow.webContents.send(config.updates.MUSIC_DATA, {
    updatedMusicData: gamesConfig.getCurrentMusicData()
  });

  // Save music data to file.
  saveManager.addToQueue(
    gamesConfig.getCurrentGameConfig().settings.musicDataPath,
    gamesConfig.getCurrentMusicData()
  );
}

/**
 * Flag that configs have been changed and send updated settings to front-end.
 * @param {object} configObject The config object to flag as changed.
 * @param {object} updatedSettings Settings to send to front-end as changed.
 */
function flagConfigChanged(configObject, updatedSettings = null) {
  if (configObject === appConfig) {
    // Save app settings to file.
    saveManager.addToQueue(appConfigPath, appConfig.getConfig());
  } else if (configObject === gamesConfig) {
    // Save games config to file.
    saveManager.addToQueue(gamesConfigPath, gamesConfig.getConfig());
  }

  if (updatedSettings != null) {
    // Send updated settings to front-end.
    log('Sending new updated config settings', LogLevel.DEBUG);
    mainWindow.webContents.send(config.updates.CONFIG, {
      updatedSettings
    });
  }
}

function getGameSupport() {
  const currentGameConfig = gamesConfig.getCurrentGameConfig();
  // Game uses Phos
  if (currentGameConfig.tool == null) {
    if (phosGameSupport == null) {
      log('Phos game support was null!', LogLevel.ERROR);
      return null;
    }

    // Get supported file types from Phos support file.
    const gameSupport = phosGameSupport.games.find(
      (gameEntry) => gameEntry.name === currentGameConfig.name
    );
    if (gameSupport == null) {
      log('Failed to find Phos game support!', LogLevel.ERROR);
      return null;
    }

    const { encodedFormat, supportedFiletypes: supported, flag } = gameSupport;
    // Remove the dot from supported file types.
    const supportedFiletypes = supported.map((type) => type.slice(1));
    log(
      `${currentGameConfig.name} - Encoded Format: ${encodedFormat} Supported Filetypes: ${supportedFiletypes}`,
      LogLevel.DEBUG
    );

    return { encodedFormat, supportedFiletypes, gameFlag: flag };
  }

  // Get encoded format and supported file types from game config.
  const {
    encodedFormat,
    supportedFiletypes: supported
  } = currentGameConfig.settings;

  // Remove the dot from supported file types.
  const supportedFiletypes = supported.map((type) => type.slice(1));

  return { encodedFormat, supportedFiletypes };
}

// Handle setting a replacement file for the given song. On success, returns the song's new
// data, null otherwise.
ipcMain.handle(config.musicData.SONG_SET_REPLACEMENT, async (e, args) => {
  const { songId } = args;

  const support = getGameSupport();
  const { supportedFiletypes } = support;

  if (songId == null) {
    log('Received bad song data!', LogLevel.ERROR);
    return null;
  }

  const newReplacementFile = await UtilsFileIO.selectFileDialog(
    mainWindow,
    'Select Replacement File...',
    [{ name: 'Song File', extensions: supportedFiletypes }]
  );

  if (newReplacementFile == null) {
    // log('Song selection cancelled', LogLevel.DEBUG);
    return null;
  }

  const newMusicData = await MusicDataUtils.updateSongReplacement(
    gamesConfig.getCurrentMusicData(),
    songId,
    newReplacementFile
  );

  if (newMusicData) {
    flagMusicDataChanged();
    const newSongData = newMusicData.songs.find((song) => song.id === songId);
    return newSongData;
  }

  log('Song selection failed!', LogLevel.ERROR);
  return null;
});

// Handle remove a replacement file for the given song. Returns whether the
// replacement file was successfully removed.
ipcMain.handle(config.musicData.SONG_REMOVE_REPLACEMENT, async (e, args) => {
  const { songId } = args;
  if (songId != null) {
    const newMusicData = await MusicDataUtils.updateSongReplacement(
      gamesConfig.getCurrentMusicData(),
      songId,
      null
    );

    if (newMusicData) {
      flagMusicDataChanged();
      return true;
    }

    log('Song replacement removal failed!', LogLevel.ERROR);
  } else {
    log('Received bad song data!', LogLevel.ERROR);
  }

  return false;
});

/**
 * Updates the given song's loop points and queues saving the
 * new loop data to file.
 * @param {string} songId Song ID which to edit.
 * @param {number} startSample Starting sample of the loop.
 * @param {number} endSample Ending sample of the loop.
 * @returns Success of updating song's data in current Music Data.
 */
async function setSavedLoop(songId, startSample, endSample) {
  const newMusicData = await MusicDataUtils.updateSongLoop(
    gamesConfig.getCurrentMusicData(),
    songId,
    startSample,
    endSample
  );

  if (newMusicData) {
    flagMusicDataChanged();
    return true;
  }

  return false;
}

/**
 * Writes the given loop data to file for batch songs.
 * @param {string} songId Song ID which to edit.
 * @param {number} startSample Starting sample of the loop.
 * @param {number} endSample Ending sample of the loop.
 * @returns Success of writing loop data to file.
 */
function setBatchLoop(songId, startSample, endSample) {
  const p4gLoopObject = {
    settings: {
      loopstart: startSample,
      loopend: endSample
    }
  };

  return UtilsFileIO.writeObjectJSON(p4gLoopObject, `${songId}.p4g`)
    .then(() => true)
    .catch(() => false);
}

// Handles changing the loop point for the given song. Handles both regular songs and
// songs that were batch converted.
ipcMain.handle(config.musicData.SONG_SET_LOOP, async (e, args) => {
  const { songId, isBatch, startSample, endSample } = args;

  if (songId == null) {
    log('Received bad song data!', LogLevel.ERROR);
    return false;
  }

  if (!isBatch) {
    const success = await setSavedLoop(songId, startSample, endSample);
    if (!success) {
      log('Song loop update failed!', LogLevel.ERROR);
    }
    return success;
  }

  const success = await setBatchLoop(songId, startSample, endSample);
  if (!success) {
    log('Batch song loop update failed!', LogLevel.ERROR);
  }
  return success;
});

/**
 * Loads the given preset into music data then updates front-end and
 * saves to file.
 * @param {object} preset Preset to load.
 */
async function loadPreset(preset) {
  await MusicDataUtils.loadMusicPreset(
    gamesConfig.getCurrentGame(),
    gamesConfig.getCurrentMusicData(),
    preset
  );
  flagMusicDataChanged();
}

//
async function changeConfig(gameIndex, setting) {
  const currentAppConfig = appConfig.getConfig();
  const currentGamesConfig = gamesConfig.getConfig();

  switch (setting.name) {
    case 'music_data': {
      const newMusicDataPath = await UtilsFileIO.selectFileDialog(
        this.window,
        'Select Music Data File...',
        [{ name: 'Music Data', extensions: ['json'] }]
      );

      if (newMusicDataPath != null) {
        const newMusicData = await gamesConfig.setMusicDataPath(
          newMusicDataPath
        );
        flagConfigChanged(gamesConfig, {
          musicData: newMusicData
        });
      }
      break;
    }
    case 'game_directory': {
      const newGameDir = await UtilsFileIO.selectFolderDialog(
        this.window,
        'Select Game Directory...'
      );
      if (newGameDir != null) {
        currentGamesConfig.games[gameIndex].settings.gameDirectory = newGameDir;
        flagConfigChanged(gamesConfig);
      }
      break;
    }
    case 'output_directory': {
      const newOutputDir = await UtilsFileIO.selectFolderDialog(
        this.window,
        'Select Output Directory...'
      );
      if (newOutputDir != null) {
        currentGamesConfig.games[
          gameIndex
        ].settings.outputDirectory = newOutputDir;
        flagConfigChanged(gamesConfig);
      }
      break;
    }
    case 'performance_mode': {
      if (setting.value != null) {
        if (setting.value === true || setting.value === false) {
          currentGamesConfig.games[gameIndex].settings.lowPerformance =
            setting.value;
        }
        flagConfigChanged(gamesConfig);
      }
      break;
    }
    case 'game_theme': {
      if (setting.value != null) {
        // Find theme object.
        const theme = Themes.find(
          (themeEntry) => themeEntry.name === setting.value
        );

        // Theme found.
        if (theme != null) {
          currentGamesConfig.games[gameIndex].theme = setting.value;
          flagConfigChanged(gamesConfig, {
            theme: theme.css
          });
        }
      } else {
        this.log('Invalid game theme value given!', LogLevel.DEBUG);
      }
      break;
    }
    case 'current_game': {
      if (setting.value != null) {
        const gameChanged = await gamesConfig.setCurrentGame(setting.value);
        if (gameChanged) {
          const newMusicData = gamesConfig.getCurrentMusicData();
          const newThemeCss = getThemeCss(gamesConfig.getGameTheme());

          flagConfigChanged(gamesConfig, {
            musicData: newMusicData,
            theme: newThemeCss
          });
        }
      } else {
        this.log('Invalid current game value given!', LogLevel.DEBUG);
      }
      break;
    }
    case 'show_debug': {
      if (setting.value != null) {
        if (setting.value === true || setting.value === false) {
          currentAppConfig.settings.showDebugMessages = setting.value;
          OutputManager.setShowDebug(setting.value);
        }

        flagConfigChanged(appConfig);
      }
      break;
    }
    default:
      break;
  }
}

// THE REASON I REFACTORED THE CONFIG. I'M NOT MAD.
// Handles changing the config.
ipcMain.handle(config.CHANGE_CONFIG, async (e, args) => {
  const { gameIndex, setting } = args;
  await changeConfig(gameIndex, setting);

  return {
    appConfig: appConfig.getConfig(),
    gamesConfig: gamesConfig.getConfig()
  };
});

module.exports = {
  gamesConfig,
  appConfig,
  saveManager,
  init,
  loadPreset,
  getGameSupport
};
