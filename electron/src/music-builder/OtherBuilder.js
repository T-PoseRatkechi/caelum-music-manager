const path = require('path');
const { spawn } = require('child_process');

const { LogLevel, log } = require('../../OutputManager');
const { buildFolderDir } = require('../../AppDirectories');

const { appConfig, gamesConfig } = require('../configs/ConfigManager');

/**
 * Builder wrapper for builder tools besides Phos. Will call the specified tool with the parameters:
 * "Example.exe" -i "{music-data-path}" -o "{output-folder-path}"
 */
class OtherBuilder {
  static log = (value, level = LogLevel.LOG) =>
    log('OtherBuilder', value, level);

  static build() {
    const currentGameConfig = gamesConfig.getCurrentGameConfig();
    const gameTool = appConfig
      .getConfig()
      .dependencies.tools.find((tool) => tool.name === currentGameConfig.tool);

    if (gameTool == null) {
      this.log(
        `Could not find tool "${currentGameConfig.tool}" for game ${currentGameConfig.name}!`,
        LogLevel.ERROR
      );
      return false;
    }

    if (gameTool.path == null) {
      this.log(
        `Path for tool "${currentGameConfig.tool}" is not set in dependencies!`,
        LogLevel.ERROR
      );
      return false;
    }

    const { musicDataPath, outputDirectory } = currentGameConfig.settings;

    const outputDir =
      outputDirectory != null
        ? outputDirectory
        : path.join(buildFolderDir, `/${gameTool.name}`);

    const toolProcess = new Promise((resolve, reject) => {
      const tool = spawn(
        `"${gameTool.path}"`,
        ['-i', `"${musicDataPath}"`, '-o', `"${outputDir}"`],
        {
          shell: true,
          cwd: path.dirname(gameTool.path)
        }
      );

      tool.stdout.on('data', (data) => {
        OtherBuilder.log(data, LogLevel.NONE);
      });
      tool.stderr.on('data', (data) => {
        OtherBuilder.log(data, LogLevel.NONE);
      });
      tool.on('close', async (code) => {
        if (code === 0) {
          OtherBuilder.log(
            `${gameTool.name} exited successfully`,
            LogLevel.DEBUG
          );
          OtherBuilder.log(`------------------------`, LogLevel.DEBUG);
          resolve();
        } else {
          OtherBuilder.log(
            `${gameTool.name} encountered problems!`,
            LogLevel.ERROR
          );
          OtherBuilder.log(`------------------------`);
          reject();
        }
      });
    })
      .then(() => true)
      .catch(() => false);

    return toolProcess;
  }
}

module.exports = { OtherBuilder };
