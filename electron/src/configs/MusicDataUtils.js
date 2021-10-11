const path = require('path');
const { promises: fs } = require('fs');

const appDirs = require('../../AppDirectories');
const { LogLevel, log: outputLog } = require('../../OutputManager');

const { parseObjectJSON, writeObjectJSON } = require('../../UtilsFileIO');
const { SaveManager } = require('./SaveManager');

const saveManager = new SaveManager();

// TODO: Possibly find another solution to editing musicData located in gamesConfig.
// currently editing the reference passed by parameters which is kind of ugh.

const log = (value, level = LogLevel.LOG) =>
  outputLog('MusicData', value, level);

async function parseTxthLoop(songFile) {
  // read in txth file
  const txthFileDir = `${songFile}.txth`;
  const txthData = await fs.readFile(txthFileDir, 'utf8').catch((err) => {
    if (err.code === 'ENOENT') {
      log(
        `Raw files require a txth file present! Missing: ${txthFileDir}`,
        LogLevel.ERROR
      );
    } else {
      log(err, LogLevel.ERROR);
    }
    return null;
  });

  // txth file was found and read in
  if (txthData != null) {
    // template settings file
    const settingsTemplate = {
      settings: {
        loopstart: 0,
        loopend: 0
      }
    };

    // find and parse loop points and samples per block
    txthData.split('\n').forEach((string) => {
      if (string.startsWith('loop_start_sample')) {
        settingsTemplate.settings.loopstart = parseInt(
          string.split(' = ')[1],
          10
        );
        // log('Found loop start sample from txth file!', LogLevel.DEBUG);
      } else if (string.startsWith('loop_end_sample')) {
        settingsTemplate.settings.loopend = parseInt(
          string.split(' = ')[1],
          10
        );
        // log('Found loop end sample from txth file!', LogLevel.DEBUG);
      }
    });

    return settingsTemplate;
  }

  return null;
}

/**
 * Gets the file path of a song's svaed loop data.
 * @param {string} songFile
 * @returns Expected file path of songFile's saved loop data.
 */
function getLoopFilePath(songFile) {
  const fileName = path.basename(songFile);
  return path.join(appDirs.loopDataFolderDir, `/${fileName}.p4g`);
}

/**
 * Gets the given song's loop data.
 * @param {string} songFile File path of song who's loop data to get.
 * @returns The songs loop data if found, null otherwise.
 */
async function getSavedLoopData(songFile) {
  const fileName = path.basename(songFile);

  // Get app saved loop data for song.
  const loopFilePath = getLoopFilePath(songFile);
  const savedLoop = await parseObjectJSON(loopFilePath, true).catch(() => null);

  if (savedLoop != null) {
    log(`${fileName}: Loaded saved loop data`, LogLevel.DEBUG);
    return savedLoop.settings;
  }

  // Load local loop data next to song file.
  const localLoopData = await parseObjectJSON(`${songFile}.p4g`, true).catch(
    () => null
  );

  if (localLoopData != null) {
    log(`${fileName}: Loaded local loop data`, LogLevel.DEBUG);
    return localLoopData.settings;
  }

  // Load local loop data inside songs folder.
  const songsFolderLoop = await parseObjectJSON(
    `${path.dirname(songFile)}/songs/${fileName}.p4g`,
    true
  ).catch(() => null);

  if (songsFolderLoop != null) {
    log(`${fileName}: Loaded songs folder loop data`, LogLevel.DEBUG);
    return songsFolderLoop.settings;
  }

  // Load loop data from txth file if song file is .raw.
  if (path.extname(songFile).toLocaleLowerCase() === '.raw') {
    const txthLoop = await parseTxthLoop(songFile);
    if (txthLoop != null) {
      log(`${fileName}: Loaded txth loop data`, LogLevel.DEBUG);
      return txthLoop.settings;
    }
  }

  // Create new loop data since none was found.
  const loopData = {
    settings: {
      loopstart: 0,
      loopend: 0
    }
  };

  const newLoopSuccess = await writeObjectJSON(loopData, `${loopFilePath}`)
    .then(() => true)
    .catch(() => false);

  if (newLoopSuccess) {
    log(`${fileName}: New loop data created`, LogLevel.DEBUG);
    return loopData.settings;
  }

  log(`${fileName}: Failed to load or create loop data!`, LogLevel.ERROR);
  return null;
}

// Changes a songs replacement file and returns the new music data on success, null otherwise.
async function updateSongReplacement(musicData, id, newFile) {
  const currentData = musicData;
  if (currentData != null) {
    // find index in music data for current via id
    const songIndex = currentData.songs.findIndex((song) => song.id === id);
    // song found
    if (songIndex > -1) {
      // set new replacement file (this changes local copy of music data)
      currentData.songs[songIndex].replacementFilePath = newFile;
      // clear loop point data if new file was null (null means removed)
      if (newFile == null) {
        currentData.songs[songIndex].loopStartSample = 0;
        currentData.songs[songIndex].loopEndSample = 0;
      } else {
        // load saved loop points
        const savedLoop = await getSavedLoopData(newFile);
        if (savedLoop) {
          currentData.songs[songIndex].loopStartSample = savedLoop.loopstart;
          currentData.songs[songIndex].loopEndSample = savedLoop.loopend;
        } else {
          currentData.songs[songIndex].loopStartSample = 0;
          currentData.songs[songIndex].loopEndSample = 0;
        }
      }

      if (newFile != null) {
        log(
          `Replacing "${
            currentData.songs[songIndex].name
          }" with "${path.basename(newFile)}"`,
          LogLevel.INFO
        );

        // enable new song lol
        currentData.songs[songIndex].isEnabled = true;
      } else {
        log(
          `Removed replacement for "${currentData.songs[songIndex].name}"`,
          LogLevel.INFO
        );

        // disable removed song lol
        currentData.songs[songIndex].isEnabled = false;
      }

      // this.flagMusicDataChanged();
      return currentData;
    }
  }

  return null;
}

/**
 * Updates the start and end loop samples of the song with the given id.
 * in the current music data.
 * @param {string} id ID of song to change loop of.
 * @param {number} startSample Loop start sample.
 * @param {number} endSample Loop end sample.
 * @returns The updated music data if change successful, null otherwise.
 */
async function updateSongLoop(musicData, id, startSample, endSample) {
  // Verify samples don't contain junk data.
  if (startSample == null || endSample == null) {
    return null;
  }

  const currentData = musicData;
  if (currentData != null) {
    // find index in music data for current via id
    const songIndex = currentData.songs.findIndex((song) => song.id === id);
    // song found
    if (songIndex > -1) {
      // set new loop samples
      currentData.songs[songIndex].loopStartSample = startSample;
      currentData.songs[songIndex].loopEndSample = endSample;

      saveManager.addToQueue(
        getLoopFilePath(currentData.songs[songIndex].replacementFilePath),
        {
          settings: {
            loopstart: startSample,
            loopend: endSample
          }
        }
      );
      return currentData;
    }
  }

  return null;
}

/**
 * Load the preset object given by preset into music data. If preset is null then it
 * will clear all current selections in music data.
 * @param {object} preset Path of preset file to load.
 */
async function loadMusicPreset(game, musicData, preset) {
  const currentData = musicData;
  // null preset is clear current music data
  if (preset == null) {
    for (let i = 0; i < currentData.songs.length; i += 1) {
      currentData.songs[i].replacementFilePath = null;
      currentData.songs[i].loopStartSample = 0;
      currentData.songs[i].loopEndSample = 0;
      currentData.songs[i].isEnabled = false;
    }
  }
  // Use default music data.
  else if (preset === 'default') {
    const defaultMusicPath = path.join(
      appDirs.settingsFolderDir,
      `/${game}/default-music-data.json`
    );
    const defaultMusic = await parseObjectJSON(defaultMusicPath).catch(
      () => null
    );

    // Have to manually copy over song entries from default data
    // since currentData just holds a reference and setting it to
    // defaultMusic won't change musicData.
    if (defaultMusic != null) {
      // Clear array.
      currentData.songs.length = 0;
      // Add each song from defaultMusic to currentData (musicData).
      defaultMusic.songs.forEach((defaultSong) =>
        currentData.songs.push(defaultSong)
      );
    }
  }
  // Handle .songs presets.
  else if (preset.game != null) {
    // Exit if the preset is for a different game.
    if (preset.game !== game) {
      log(
        `Song Pack Preset is for a different game! Preset game: ${preset.game}`,
        LogLevel.ERROR
      );
      return;
    }

    // Replace entire current music data object with preset's.
    if (preset.type === 'music-data') {
      currentData.songs = preset.songs;
      log('Music Data Preset loaded', LogLevel.INFO);
    }
    // Apply song pack preset to current music data.
    else if (preset.type === 'song-pack') {
      preset.songs.forEach((presetSong) => {
        const existingIndex = currentData.songs.findIndex(
          (existingSong) =>
            existingSong.outputFilePath === presetSong.outputFilePath
        );

        // Current music data has an existing entry with preset song's outputFilePath.
        if (existingIndex !== -1) {
          currentData.songs[existingIndex].isEnabled = true;
          currentData.songs[existingIndex].name = presetSong.name;
          currentData.songs[existingIndex].category = presetSong.category;
          currentData.songs[existingIndex].replacementFilePath =
            presetSong.replacementFilePath;
          currentData.songs[existingIndex].loopStartSample =
            presetSong.loopStartSample;
          currentData.songs[existingIndex].loopEndSample =
            presetSong.loopEndSample;
          currentData.songs[existingIndex].extraData = presetSong.extraData;

          log(
            `Song Pack: Replacing "${presetSong.name}" with "${path.basename(
              presetSong.replacementFilePath
            )}"`,
            LogLevel.DEBUG
          );
        }
        // Add song as new entry to current music data.
        else {
          const currentTotalSongs = currentData.songs.length;

          const newSong = {
            id: `${currentTotalSongs}`,
            isEnabled: true,
            name: presetSong.name,
            category: presetSong.category,
            originalFile: null,
            replacementFilePath: presetSong.replacementFilePath,
            loopStartSample: presetSong.loopStartSample,
            loopEndSample: presetSong.loopEndSample,
            outputFilePath: presetSong.outputFilePath,
            extraData: presetSong.outputFilePath
          };

          currentData.songs.push(newSong);
          log(`New song added by Song Pack: ${preset.name}`, LogLevel.DEBUG);
        }
      });

      log(`Song Pack: ${preset.name} loaded`, LogLevel.INFO);
    }
  }
  // Handle legacy .p4g presets.
  else if (preset.songpack != null) {
    preset.songpack.forEach((song) => {
      const existingIndex = currentData.songs.findIndex(
        (item) => item.id === song.id
      );
      if (existingIndex !== -1) {
        currentData.songs[existingIndex].isEnabled = true;
        if (currentData.songs[existingIndex].category === 'hidden') {
          currentData.songs[existingIndex].category = 'Song Preset';
        }
        currentData.songs[existingIndex].replacementFilePath = song.fileName;
        currentData.songs[existingIndex].loopStartSample = song.loopstartSample;
        currentData.songs[existingIndex].loopEndSample = song.loopendSample;
      }
    });

    log('Legacy Song Pack Preset loaded', LogLevel.INFO);
  }
  // Handle invalid preset.
  else {
    log('Invalid preset was selected!', LogLevel.ERROR);
  }
}

module.exports = { updateSongReplacement, updateSongLoop, loadMusicPreset };
