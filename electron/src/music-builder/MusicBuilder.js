const { ipcMain } = require('electron');

const { LogLevel, log } = require('../../OutputManager');
const { saveManager, gamesConfig } = require('../configs/ConfigManager');
const { Phos } = require('./Phos');

const { channels } = require('../../../src/shared/constants');
const { OtherBuilder } = require('./OtherBuilder');

class MusicBuilder {
  log = (value, level = LogLevel.LOG) => log('MusicBuilder', value, level);

  init() {
    this.registerListeners();
  }

  registerListeners() {
    ipcMain.handle(channels.GENERATE_BUILD, async () => {
      this.log(`Building output`, LogLevel.INFO);

      const gameConfig = gamesConfig.getCurrentGameConfig();
      if (gamesConfig == null) {
        return false;
      }

      await saveManager.forceSave(true);

      let success = false;

      // Build with default tool (Phos) if no other one is set.
      if (gameConfig.tool == null) {
        success = await Phos.build();
      } else {
        // Build with some other tool.
        success = await OtherBuilder.build();
      }

      if (!success) {
        this.log('Failed to generate Music Build!', LogLevel.ERROR);
      }

      return success;
    });

    this.log('Registered events', LogLevel.DEBUG);
  }
}

module.exports = { MusicBuilder };
