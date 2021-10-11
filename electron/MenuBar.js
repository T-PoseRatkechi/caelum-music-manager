const { dialog } = require('electron');
const path = require('path');
const { LogLevel, log } = require('./OutputManager');
const ConfigManager = require('./src/configs/ConfigManager');
const { Phos } = require('./src/music-builder/Phos');
const { BatchWindow } = require('./src/windows/BatchWindow');
const { ConfigWindow } = require('./src/windows/ConfigWindow');
const UtilsFileIO = require('./UtilsFileIO');

const configWindow = new ConfigWindow();

const inDev = process.env.APP_ENV === 'development';
class MenuBar {
  static log = (value, level = LogLevel.LOG) => log('MenuBar', value, level);

  /**
   * Creates a new empty preset based either on current music data or game's
   * default music data.
   * @param {object} window Window to attach to.
   */
  static async newEmptyPreset(window) {
    const selectionResult = await dialog
      .showMessageBox(window, {
        title: 'Create New Preset',
        message:
          'Select whether the new preset is based on the current music data or the default music data.',
        type: 'info',
        buttons: ['Use Current Music Data', 'Use Default Music Data', 'cancel']
      })
      .catch(() => null);

    if (selectionResult == null) {
      this.log('Problem getting new preset selection!', LogLevel.ERROR);
      return;
    }

    switch (selectionResult.response) {
      case 0:
        ConfigManager.loadPreset(null);
        MenuBar.log('New empty preset created', LogLevel.INFO);
        break;
      case 1:
        ConfigManager.loadPreset('default');
        MenuBar.log('New default empty preset created', LogLevel.INFO);
        break;
      case 2:
        break;
      default:
        break;
    }
  }

  /**
   * Exports the current Music Build as a Song Pack Preset.
   * @param {object} window Window to attach to.
   */
  static async exportPresetBuild(window) {
    const presetFileSave = await UtilsFileIO.saveFileDialog(
      window,
      'Save Song Pack Preset to...',
      [{ name: 'Preset', extensions: ['songs'] }]
    );

    if (presetFileSave != null) {
      // Export song files into a songs folder.
      const exportFolder = path.join(path.dirname(presetFileSave), '/songs');
      // Name of preset, taken from the preset file's name.
      const presetName = path.basename(presetFileSave, '.songs');

      // Export song files via Phos.
      const { success, encodedFormat } = await Phos.export(exportFolder);

      if (success) {
        const musicData = ConfigManager.gamesConfig.getCurrentMusicData();
        const presetTemplate = {
          game: musicData.game,
          name: presetName,
          type: 'song-pack',
          songs: []
        };

        // Get the file name as exported through Phos.
        const getPresetFileName = (originalFile) =>
          `${path.basename(originalFile).slice(0, -4)}${encodedFormat}`;

        const loopDataFiles = [];

        musicData.songs.forEach(async (song) => {
          if (song.isEnabled && song.replacementFilePath != null) {
            const presetFileName = getPresetFileName(song.replacementFilePath);

            presetTemplate.songs.push({
              name: song.name,
              category: song.category,
              replacementFilePath: presetFileName,
              loopStartSample: song.loopStartSample,
              loopEndSample: song.loopEndSample,
              outputFilePath: song.outputFilePath,
              extraData: song.extraData
            });

            if (
              loopDataFiles.findIndex(
                (loopItem) => loopItem.filename === `${presetFileName}.p4g`
              ) === -1
            ) {
              const loopTemplate = {
                settings: {
                  loopstart: song.loopStartSample,
                  loopend: song.loopEndSample
                }
              };

              loopDataFiles.push({
                filename: `${presetFileName}.p4g`,
                loopdata: loopTemplate
              });
            }
          }
        });

        loopDataFiles.forEach(async (loop) => {
          await UtilsFileIO.writeObjectJSON(
            loop.loopdata,
            path.join(exportFolder, loop.filename)
          );
        });

        await UtilsFileIO.writeObjectJSON(presetTemplate, presetFileSave);
      }
    }
  }

  /**
   * Saves a copy of the current music data.
   * @param {object} window Window to attach to.
   */
  static async savePreset(window) {
    const presetFile = await UtilsFileIO.saveFileDialog(
      window,
      'Save Preset...',
      [{ name: 'Song Pack', extensions: ['songs'] }]
    );

    if (presetFile != null) {
      const presetName = path.basename(presetFile, '.songs');
      const presetSongs = ConfigManager.gamesConfig.getCurrentMusicData().songs;
      const presetTemplate = {
        game: ConfigManager.gamesConfig.getCurrentGame(),
        name: presetName,
        type: 'music-data',
        songs: presetSongs
      };

      await UtilsFileIO.writeObjectJSON(
        presetTemplate,
        presetFile
      ).catch(() => {});
    }
  }

  static async loadPreset(window) {
    const presetFile = await UtilsFileIO.selectFileDialog(
      window,
      'Select Preset to Load...',
      [
        { name: 'Song Pack', extensions: ['songs'] },
        { name: 'Legacy Song Pack', extensions: ['p4g'] }
      ]
    );
    if (presetFile != null) {
      // Parse preset file.
      const presetObject = await UtilsFileIO.parseObjectJSON(presetFile).catch(
        () => {
          this.log(
            `Could not parse preset file! File: ${presetFile}`,
            LogLevel.ERROR
          );
          return null;
        }
      );

      if (presetObject != null) {
        const presetFolder = path.dirname(presetFile);

        if (presetObject.type != null) {
          // Pre-append preset file's directory to replaceFilePaths
          if (presetObject.type === 'song-pack') {
            for (let i = 0; i < presetObject.songs.length; i += 1) {
              presetObject.songs[i].replacementFilePath = path.join(
                presetFolder,
                `/songs/${presetObject.songs[i].replacementFilePath}`
              );
            }
          }
        }
        // Handle prepping legacy song packs.
        else if (presetObject.songpack != null) {
          for (let i = 0; i < presetObject.songpack.length; i += 1) {
            presetObject.songpack[i].fileName = path.join(
              presetFolder,
              `/${presetObject.songpack[i].fileName}`
            );
          }

          this.log(
            'Legacy Song Packs might have songs misplaced or missing!',
            LogLevel.WARN
          );
        }

        // Prompt whether to clear all current songs before loading preset.
        const selectionResult = await dialog
          .showMessageBox(window, {
            title: 'Apply Preset',
            message: 'Select how you would like to apply the Song Pack Preset.',
            type: 'info',
            buttons: [
              'Clear current songs then apply preset',
              'Apply preset over current songs',
              'cancel'
            ]
          })
          .catch(() => null);

        if (selectionResult == null) {
          this.log('Problem getting apply preset selection!', LogLevel.ERROR);
          return;
        }

        switch (selectionResult.response) {
          case 0:
            await ConfigManager.loadPreset(null);
            await ConfigManager.loadPreset(presetObject);
            break;
          case 1:
            await ConfigManager.loadPreset(presetObject);
            break;
          case 2:
            break;
          default:
            break;
        }
      }
    }
  }

  static getMenuTemplate(menuType, window) {
    switch (menuType) {
      case 'main':
        return MenuBar.mainMenu(window);
      default:
        return null;
    }
  }

  static mainMenu(window) {
    const mainMenuTemplate = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Preset',
            accelerator: process.platform === 'darwin' ? 'Command+N' : 'Ctrl+N',
            click() {
              MenuBar.newEmptyPreset(window);
            }
          },
          {
            label: 'Save Preset...',
            accelerator: process.platform === 'darwin' ? 'Command+S' : 'Ctrl+S',
            click() {
              MenuBar.savePreset(window);
            }
          },
          {
            label: 'Load Preset...',
            accelerator: process.platform === 'darwin' ? 'Command+O' : 'Ctrl+O',
            click() {
              MenuBar.loadPreset(window);
            }
          },
          {
            label: 'Open Config',
            click() {
              configWindow.openWindow(window);
            }
          },
          {
            role: 'reload'
          },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
            click() {
              // app.quit();
            }
          }
        ]
      },
      {
        label: 'Tools',
        submenu: [
          {
            label: 'Batch Convert Songs...',
            click() {
              const batch = new BatchWindow();
              batch.openWindow();
            }
          },
          {
            label: 'Export as Song Pack Preset...',
            click() {
              MenuBar.exportPresetBuild(window);
            }
          }
        ]
      }
    ];

    if (inDev) {
      mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
          {
            label: 'Toggle DevTools',
            accelerator: process.platform === 'darwin' ? 'Command+I' : 'Ctrl+I',
            click(item, focusedWindow) {
              focusedWindow.toggleDevTools();
            }
          }
        ]
      });
    }

    return mainMenuTemplate;
  }
}

module.exports = { MenuBar };
