const path = require('path');
const { Game, Theme } = require('../AppConstants');
const { dependenciesFolderDir } = require('../../AppDirectories');

const defaultConfig = {
  settings: {
    showDebugMessages: false
  },
  dependencies: {
    phosPath: path.join(
      dependenciesFolderDir,
      '/phos-music-converter/release-build/PhosMusicConverterCMD.exe'
    ),
    tools: [
      {
        name: 'Example',
        path: null
      }
    ]
  }
};

const defaultGamesConfig = {
  selectedGame: null,
  games: [
    {
      name: Game.P4G,
      theme: Theme.DefaultDark.name,
      installed: false,
      tool: null,
      settings: {
        musicDataPath: null,
        gameDirectory: null,
        outputDirectory: null,
        lowPerformance: false,
        encodedFormat: '.raw',
        supportedFiletypes: ['.wav', '.raw']
      }
    },
    {
      name: Game.P5,
      theme: Theme.RoyalRed.name,
      installed: false,
      tool: null,
      settings: {
        musicDataPath: null,
        gameDirectory: null,
        outputDirectory: null,
        lowPerformance: false,
        encodedFormat: null,
        supportedFiletypes: []
      }
    },
    {
      name: Game.P3F,
      theme: Theme.PhosTeal.name,
      installed: false,
      tool: null,
      settings: {
        musicDataPath: null,
        gameDirectory: null,
        outputDirectory: null,
        lowPerformance: false,
        encodedFormat: null,
        supportedFiletypes: []
      }
    },
    {
      name: Game.P4,
      theme: Theme.ClassicOrange.name,
      installed: false,
      tool: null,
      settings: {
        musicDataPath: null,
        gameDirectory: null,
        outputDirectory: null,
        lowPerformance: false,
        encodedFormat: null,
        supportedFiletypes: []
      }
    },
    {
      name: Game.KH3,
      theme: Theme.RoyalRed.name,
      installed: false,
      tool: null,
      settings: {
        musicDataPath: null,
        gameDirectory: null,
        outputDirectory: null,
        lowPerformance: false,
        encodedFormat: null,
        supportedFiletypes: []
      }
    }
  ]
};

module.exports = { defaultConfig, defaultGamesConfig };
