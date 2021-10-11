const path = require('path');

const {
  writeObjectJSON,
  parseObjectJSON,
  pathDidntExist
} = require('../../UtilsFileIO');

const { settingsFolderDir } = require('../../AppDirectories');
const { log, LogLevel } = require('../../OutputManager');
const { defaultGamesConfig } = require('./Defaults');

const gamesConfigPath = path.join(settingsFolderDir, '/games-config.json');

class GamesConfig {
  log = (value, level = LogLevel.LOG) => log('GamesConfig', value, level);

  gamesConfig = null;

  async init() {
    const gamesConfigLoaded = await this.loadGamesConfig();
    if (!gamesConfigLoaded) {
      return false;
    }

    const musicDataLoaded = await this.loadMusicData();
    if (!musicDataLoaded) {
      return false;
    }

    return true;
  }

  /**
   * Loads the games config. Will create a new default games config if missing.
   * @returns Boolean indicating whether the games config was loaded or created successfully.
   */
  async loadGamesConfig() {
    // Load saved games config file.
    const config = await parseObjectJSON(gamesConfigPath, true).catch(
      async (err) => {
        // Games config did not exist.
        if (pathDidntExist(err)) {
          // Create new games config.
          const newConfigSuccess = await writeObjectJSON(
            defaultGamesConfig,
            gamesConfigPath
          )
            .then(() => true)
            .catch(() => false);

          // Return default config if write success.
          if (newConfigSuccess) {
            this.log('Created new games config');
            return defaultGamesConfig;
          }

          this.log('Failed to create new games config!', LogLevel.ERROR);
        }

        return null;
      }
    );

    if (config != null) {
      this.gamesConfig = config;
      this.log('Games config loaded', LogLevel.DEBUG);
      return true;
    }

    this.log('Failed to load games config!', LogLevel.ERROR);
    return false;
  }

  /**
   * Writes the current games config to file.
   * @returns Success of write.
   */
  async writeGamesConfig() {
    if (this.gamesConfig == null) {
      this.log('Attempt to write a null games config to file!', LogLevel.ERROR);
      return false;
    }

    const writeSuccess = await writeObjectJSON(
      this.gamesConfig,
      gamesConfigPath
    )
      .then(() => true)
      .catch(() => false);

    if (writeSuccess) {
      this.log('Games config file updated', LogLevel.DEBUG);
      return true;
    }

    this.log('Failed to write games config to file!', LogLevel.ERROR);
    return false;
  }

  /**
   * Loads current game's music data. Will create a new default music data if missing.
   * Music data can be null.
   * @returns Whether the music data was set correctly.
   */
  async loadMusicData() {
    const currentGame = this.getCurrentGame();
    // No game is currently selected, null music data of course.
    if (currentGame == null) {
      this.log('No game selected, music data set to null', LogLevel.DEBUG);
      this.musicData = null;
      return true;
    }

    const currentGameConfig = this.getGameConfig(currentGame);

    // Load saved music data.
    if (currentGameConfig.settings.musicDataPath != null) {
      const musicData = await parseObjectJSON(
        currentGameConfig.settings.musicDataPath,
        true
      ).catch(() => null);

      if (musicData != null) {
        this.musicData = musicData;
        this.log(`Music data loaded for ${currentGame}`, LogLevel.DEBUG);
        return true;
      }
    }

    // Create new music data from game default music data.
    const defaultMusicDataPath = path.join(
      settingsFolderDir,
      `/${currentGame}/default-music-data.json`
    );

    const defaultMusicData = await parseObjectJSON(
      defaultMusicDataPath,
      true
    ).catch((err) => {
      if (pathDidntExist(err)) {
        this.log(
          `No default music data found for ${currentGame}!`,
          LogLevel.ERROR
        );
      } else {
        this.log(
          `Failed to load default music data for ${currentGame}!`,
          LogLevel.ERROR
        );
      }

      return null;
    });

    // No default music data found.
    if (defaultMusicData == null) {
      this.musicData = null;
      return true;
    }

    // Default path for current music data.
    const currentMusicDataPath = path.join(
      settingsFolderDir,
      `/${currentGame}/current-music-data.json`
    );

    // Write default current music data.
    const newCurrentDataSuccess = await writeObjectJSON(
      defaultMusicData,
      currentMusicDataPath
    )
      .then(() => true)
      .catch(() => false);

    // New current music data successfully written.
    if (newCurrentDataSuccess) {
      // Set local music data.
      this.musicData = defaultMusicData;

      // Update games config file.
      currentGameConfig.settings.musicDataPath = currentMusicDataPath;

      const configUpdateSuccess = await writeObjectJSON(
        this.gamesConfig,
        gamesConfigPath
      )
        .then(() => true)
        .catch(() => false);

      if (configUpdateSuccess) {
        this.log(`Created new music data for ${currentGame}`);
        return true;
      }
    }

    this.musicData = null;
    this.log(`Failed to set music data for ${currentGame}!`, LogLevel.ERROR);
    return false;
  }

  /**
   * Get the currently loaded games config.
   * @returns Loaded games config.
   */
  getConfig() {
    return this.gamesConfig;
  }

  /**
   * Gets name of currently selected game.
   * @returns {string} Currently selected game.
   */
  getCurrentGame() {
    if (this.gamesConfig == null) {
      return null;
    }

    return this.gamesConfig.selectedGame;
  }

  /**
   * Set currently selected game and loads new music data.
   * @param {string} newGame Name of the new game to set as current.
   * @returns {Promise<boolean>} Whether game change was successful.
   */
  async setCurrentGame(newGame) {
    if (newGame == null) {
      log('Null given as new game to set!', LogLevel.ERROR);
      return false;
    }

    const availableGames = this.getGamesList();

    if (availableGames.includes(newGame)) {
      this.log(`Game changed to ${newGame}`, LogLevel.DEBUG);
      this.gamesConfig.selectedGame = newGame;
      await this.loadMusicData();
      return true;
    }

    this.log(`${newGame} not found in games list!`, LogLevel.ERROR);
    return false;
  }

  /**
   * Set the path of current game's music data and the load new music data.
   * @param {string} musicPath New path to music data file.
   * @returns Success of loading new music data.
   */
  async setMusicDataPath(musicPath) {
    if (musicPath == null) {
      this.log('Null given as music data path!', LogLevel.ERROR);
      return null;
    }

    this.getCurrentGameConfig().settings.musicDataPath = musicPath;
    await this.loadMusicData();
    return this.getCurrentMusicData();
  }

  /**
   * Gets config of current game.
   * @returns {string} Currently selected game's config.
   */
  getCurrentGameConfig() {
    if (this.gamesConfig === null) {
      return null;
    }

    return this.gamesConfig.games.find(
      (game) => game.name === this.getCurrentGame()
    );
  }

  /**
   * Get a game's config.
   * @param {string} gameName Name of game who's config to get.
   * @returns gameName's config if found, else null.
   */
  getGameConfig(gameName) {
    // Return early if games config has failed to load.
    if (this.gamesConfig == null) {
      return null;
    }

    // Search for game entry that matches the given gameName.
    const gameConfig = this.gamesConfig.games.find(
      (game) => game.name === gameName
    );

    // Return game config if found.
    if (gameConfig != null) {
      return gameConfig;
    }

    return null;
  }

  /**
   * Gets list of all games in games config.
   * @returns List of all games in games config. If games config null, returns empty array.
   */
  getGamesList() {
    if (this.gamesConfig == null) {
      return [];
    }

    return this.gamesConfig.games.map((game) => game.name);
  }

  /**
   * Get a game's theme.
   * @param {string} gameName Name of game who's theme to get.
   * @returns gameName's theme if found, else null.
   */
  getGameTheme() {
    if (this.gamesConfig == null) {
      return null;
    }

    const currentGame = this.getCurrentGame();

    // Get game's config.
    const config = this.gamesConfig.games.find(
      (game) => game.name === currentGame
    );

    // Return game's theme if game found.
    if (config != null) {
      return config.theme;
    }

    return null;
  }

  /**
   * Returns the current music data.
   * @returns The current music data object.
   */
  getCurrentMusicData() {
    return this.musicData;
  }
}

module.exports = { GamesConfig, gamesConfigPath };
