const path = require('path');
const { spawn } = require('child_process');

const { OutputManager, LogLevel, log } = require('../../OutputManager');
const { buildFolderDir } = require('../../AppDirectories');
const { Game } = require('../AppConstants');

const {
  appConfig,
  gamesConfig,
  getGameSupport
} = require('../configs/ConfigManager');

class Phos {
  static log = (value, level = LogLevel.LOG) => log('Phos', value, level);

  static build() {
    const gameSupport = getGameSupport();
    const { gameFlag } = gameSupport;

    const { phosPath } = appConfig.getDependencies();

    const currentGame = gamesConfig.getCurrentGame();

    const {
      musicDataPath,
      outputDirectory,
      lowPerformance
    } = gamesConfig.getCurrentGameConfig().settings;

    const outputDir =
      outputDirectory != null
        ? outputDirectory
        : path.join(buildFolderDir, `/${currentGame}`);

    if (gameFlag == null) {
      Phos.log(
        `Unknown current game! Current game: ${currentGame}`,
        LogLevel.ERROR
      );
      return false;
    }

    const phosProccess = new Promise((resolve, reject) => {
      const phosConverter = spawn(
        `"${phosPath}"`,
        [
          'build',
          '-g',
          gameFlag,
          '-i',
          `"${musicDataPath}"`,
          '-o',
          `"${outputDir}"`,
          `${OutputManager.getShowDebug() ? '-v' : ''}`,
          `${lowPerformance ? '-l' : ''}`
        ],
        {
          shell: true,
          cwd: path.dirname(phosPath)
        }
      );

      phosConverter.stdout.on('data', (data) => {
        Phos.log(data, LogLevel.NONE);
      });
      phosConverter.stderr.on('data', (data) => {
        Phos.log(data, LogLevel.NONE);
      });
      phosConverter.on('close', async (code) => {
        if (code === 0) {
          Phos.log(`Phos Music Converter exited successfully`, LogLevel.DEBUG);
          Phos.log(`------------------------`, LogLevel.DEBUG);
          resolve();
        } else {
          Phos.log(
            `Phos Music Converter encountered problems!`,
            LogLevel.ERROR
          );
          Phos.log(`------------------------`);
          reject();
        }
      });
    })
      .then(() => true)
      .catch(() => false);

    return phosProccess;
  }

  static batch(batchFolder) {
    const currentGame = gamesConfig.getCurrentGame();

    const gameSupport = getGameSupport();
    const { encodedFormat, gameFlag } = gameSupport;

    if (gameFlag == null) {
      Phos.log(
        `Unknown current game! Current game: ${currentGame}`,
        LogLevel.ERROR
      );
      return false;
    }

    if (encodedFormat == null) {
      Phos.log(
        `Unknown encoded format! Current game: ${currentGame}`,
        LogLevel.ERROR
      );
      return false;
    }

    const { phosPath } = appConfig.getDependencies();

    const { lowPerformance } = gamesConfig.getCurrentGameConfig().settings;

    const phosProccess = new Promise((resolve, reject) => {
      const phosConverter = spawn(
        `"${phosPath}"`,
        [
          'batch',
          '-g',
          gameFlag,
          '-f',
          `"${batchFolder}"`,
          `${OutputManager.getShowDebug() ? '-v' : ''}`,
          `${lowPerformance ? '-l' : ''}`
        ],
        {
          shell: true,
          cwd: path.dirname(phosPath)
        }
      );

      phosConverter.stdout.on('data', (data) => {
        Phos.log(data, LogLevel.NONE);
      });
      phosConverter.stderr.on('data', (data) => {
        Phos.log(data, LogLevel.NONE);
      });
      phosConverter.on('close', async (code) => {
        if (code === 0) {
          Phos.log(`Phos Music Converter exited successfully`, LogLevel.DEBUG);
          Phos.log(`------------------------`, LogLevel.DEBUG);
          resolve();
        } else {
          Phos.log(
            `Phos Music Converter encountered problems!`,
            LogLevel.ERROR
          );
          Phos.log(`------------------------`);
          reject();
        }
      });
    })
      .then(() => ({ success: true, encodedFormat }))
      .catch(() => ({ success: false, encodedFormat }));

    return phosProccess;
  }

  static export(exportFolder) {
    const gameSupport = getGameSupport();
    const { encodedFormat, gameFlag } = gameSupport;

    const {
      musicDataPath,
      lowPerformance
    } = gamesConfig.getCurrentGameConfig().settings;

    const { phosPath } = appConfig.getDependencies();
    const currentGame = gamesConfig.getCurrentGame();

    if (gameFlag == null) {
      Phos.log(
        `Unknown current game! Current game: ${currentGame}`,
        LogLevel.ERROR
      );
      return false;
    }

    const phosProccess = new Promise((resolve, reject) => {
      const phosConverter = spawn(
        `"${phosPath}"`,
        [
          'export',
          '-g',
          gameFlag,
          '-i',
          `"${musicDataPath}"`,
          '-o',
          `"${exportFolder}"`,
          `${OutputManager.getShowDebug() ? '-v' : ''}`,
          `${lowPerformance ? '-l' : ''}`
        ],
        {
          shell: true,
          cwd: path.dirname(phosPath)
        }
      );

      phosConverter.stdout.on('data', (data) => {
        Phos.log(data, LogLevel.NONE);
      });
      phosConverter.stderr.on('data', (data) => {
        Phos.log(data, LogLevel.NONE);
      });
      phosConverter.on('close', async (code) => {
        if (code === 0) {
          Phos.log(`Phos Music Converter exited successfully`, LogLevel.DEBUG);
          Phos.log(`------------------------`, LogLevel.DEBUG);
          resolve();
        } else {
          Phos.log(
            `Phos Music Converter encountered problems!`,
            LogLevel.ERROR
          );
          Phos.log(`------------------------`);
          reject();
        }
      });
    })
      .then(() => ({ success: true, encodedFormat }))
      .catch(() => ({ success: false, encodedFormat }));

    return phosProccess;
  }

  static extract() {
    const currentGame = gamesConfig.getCurrentGame();
    const { gameDirectory } = gamesConfig.getCurrentGameConfig().settings;
    if (gameDirectory == null) {
      Phos.log(
        `Can't extract music with missing Game Directory for ${currentGame}! Set Game Directory in the Game Config then try again.`,
        LogLevel.ERROR
      );
      return false;
    }

    const { phosPath } = appConfig.getDependencies();

    let originalMusicFile = null;
    const outputDir = path.join(
      path.dirname(phosPath),
      `/${currentGame}/original-songs`
    );

    // TODO: Extract music for other games.
    switch (currentGame) {
      case Game.P4G:
        originalMusicFile = path.join(gameDirectory, `/SND/BGM.xwb`);
        break;
      case Game.P5:
      case Game.P3F:
      default:
        break;
    }

    const phosProccess = new Promise((resolve, reject) => {
      const phosConverter = spawn(
        `"${phosPath}"`,
        [
          'extract',
          '-i',
          `"${originalMusicFile}"`,
          '-o',
          `"${outputDir}"`,
          `${OutputManager.getShowDebug() ? '-v' : ''}`
        ],
        {
          shell: true,
          cwd: path.dirname(phosPath)
        }
      );

      phosConverter.stdout.on('data', (data) => {
        Phos.log(data, LogLevel.NONE);
      });
      phosConverter.stderr.on('data', (data) => {
        Phos.log(data, LogLevel.NONE);
      });
      phosConverter.on('close', async (code) => {
        if (code === 0) {
          Phos.log(`Phos Music Converter exited successfully`, LogLevel.DEBUG);
          Phos.log(`------------------------`, LogLevel.DEBUG);
          resolve();
        } else {
          Phos.log(
            `Phos Music Converter encountered problems!`,
            LogLevel.ERROR
          );
          Phos.log(`------------------------`);
          reject();
        }
      });
    })
      .then(() => true)
      .catch(() => false);

    return phosProccess;
  }
}

module.exports = { Phos };
