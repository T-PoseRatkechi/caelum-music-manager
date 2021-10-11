module.exports = {
  channels: {
    RELOAD: 'reload_app',
    OUTPUT_BOX: 'output_box',
    GENERATE_BUILD: 'generate_build',
    BATCH_BUILD: 'batch_build',
    PLAY_SONG: 'play_song'
  },
  dialogRequest: {
    FOLDER: 'folder_dialog',
    FILE: 'file_dialog'
  },
  appEvents: {
    app: {
      STATUS_UPDATE: 'status_update'
    },
    config: {
      request: {
        GAME_THEME: 'game_theme',
        MUSIC_DATA: 'music_data',
        GAMES_CONFIG: 'games_config',
        APP_CONFIG: 'app_config',
        APP_THEMES: 'app_themes'
      },
      musicData: {
        SONG_SET_REPLACEMENT: 'song_set_replacement',
        SONG_REMOVE_REPLACEMENT: 'song_remove_replacement',
        SONG_SET_LOOP: 'song_set_loop'
      },
      updates: {
        CONFIG: 'config_updated',
        MUSIC_DATA: 'music_data_updated'
      },
      CHANGE_CONFIG: 'change_config'
    }
  }
};
