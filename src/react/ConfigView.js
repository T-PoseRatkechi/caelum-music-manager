import React, { Component } from 'react';
import M from 'materialize-css';

import './scss/ConfigView.scss';

import LoadingBar from './components/common/LoadingBar';
import SelectItemButton from './components/common/SelectItemButton';

import { appEvents } from '../shared/constants';

const { ipcRenderer } = window;

// TODO: Give this a pass over later because it works but I was kinda tired
// while fixing things so I'm not entirely sure how it works.

export default class ConfigView extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.changeSetting = this.changeSetting.bind(this);

    this.state = {
      theme: 'defaultDark',
      themeIndex: -1,
      allThemes: null,
      appConfig: null,
      gamesConfig: null,
      currentConfigIndex: 0
    };
  }

  async componentDidMount() {
    await this.setTheme();

    // Get app config.
    const appConfig = await ipcRenderer.invoke(
      appEvents.config.request.APP_CONFIG
    );

    // Get games config.
    const gamesConfig = await ipcRenderer.invoke(
      appEvents.config.request.GAMES_CONFIG
    );

    // Calculate index for current game in games config.
    const selectedGameIndex = gamesConfig.games.findIndex(
      (game) => game.name === gamesConfig.selectedGame
    );

    // Get list of app themes.
    const allThemes = await ipcRenderer.invoke(
      appEvents.config.request.APP_THEMES
    );
    const themeIndex = allThemes.findIndex(
      (theme) => theme === gamesConfig.games[selectedGameIndex].theme
    );

    this.setState({
      appConfig,
      gamesConfig,
      allThemes,
      themeIndex,
      currentConfigIndex: selectedGameIndex !== -1 ? selectedGameIndex : 0
    });
  }

  componentDidUpdate() {
    const elems = document.querySelectorAll('.dropdown-trigger');
    M.Dropdown.init(elems, { inDuration: 300, outDuration: 225 });
  }

  async handleClick(e, args) {
    const { source, gameIndex } = args;
    switch (source) {
      case 'dropdown':
        this.setState({
          currentConfigIndex: gameIndex
        });
        break;
      default:
        break;
    }
  }

  async setTheme() {
    const themeClass = await ipcRenderer.invoke(
      appEvents.config.request.GAME_THEME
    );
    this.setState({
      theme: themeClass
    });
  }

  getGameConfig() {
    const { gamesConfig, currentConfigIndex } = this.state;

    const game = gamesConfig.games[currentConfigIndex];

    return (
      <div key={game.name} className="game-settings layer-1 z-depth-2">
        <h5 className="game-name second-color">
          <b>{game.name}</b>
        </h5>
        <h6>
          <b>Installed: </b>
          {game.installed ? 'Yes' : 'No'}
        </h6>
        <h6>
          <b>Theme: </b>
          {this.getThemesDropdown()}
        </h6>
        <h6 className="filepath-over">
          <b>Music Data: </b>
          <span title={game.settings.musicDataPath}>
            {game.settings.musicDataPath == null
              ? 'Set Music Data Path'
              : game.settings.musicDataPath}
          </span>
        </h6>
        <SelectItemButton
          itemName={`Select ${game.name} Music Data`}
          itemIcon="insert_drive_file"
          onClick={(e) =>
            this.changeSetting(e, {
              settingName: 'music_data'
            })
          }
        />
        <h6 className="filepath-over">
          <b>Game Directory: </b>
          <span title={game.settings.gameDirectory}>
            {game.settings.gameDirectory == null
              ? 'Set Game Directory'
              : game.settings.gameDirectory}
          </span>
        </h6>
        <SelectItemButton
          itemName={`Select ${game.name} Game Directory`}
          itemIcon="folder"
          onClick={(e) =>
            this.changeSetting(e, {
              settingName: 'game_directory'
            })
          }
        />
        <h6 className="filepath-over">
          <b>Output Directory: </b>
          <span title={game.settings.outputDirectory}>
            {game.settings.outputDirectory == null
              ? 'Set Output Directory'
              : game.settings.outputDirectory}
          </span>
        </h6>
        <SelectItemButton
          itemName={`Select ${game.name} Output Directory`}
          itemIcon="folder"
          onClick={(e) =>
            this.changeSetting(e, { settingName: 'output_directory' })
          }
        />
        <h6>
          <b>Low Performance Mode: </b>
          <span>
            <label htmlFor="lowPerformanceCheck">
              <input
                type="checkbox"
                className="filled-in"
                checked={game.settings.lowPerformance}
                id="lowPerformanceCheck"
                onChange={(e) =>
                  this.changeSetting(e, {
                    settingName: 'performance_mode',
                    settingValue: e.target.checked
                  })
                }
              />
              <span htmlFor="lowPerformanceCheck">Enabled</span>
            </label>
          </span>
        </h6>
      </div>
    );
  }

  getGamesDropdown() {
    const { gamesConfig, currentConfigIndex } = this.state;
    return (
      <>
        <a className="dropdown-trigger btn" href="#!" data-target="dropdown1">
          {gamesConfig.games[currentConfigIndex].name}
          <i className="material-icons">arrow_downward</i>
        </a>

        <ul id="dropdown1" className="dropdown-content">
          {gamesConfig.games.map((game) => (
            <li key={game.name}>
              <a
                href="#!"
                onClick={(e) =>
                  this.changeSetting(e, {
                    settingName: 'current_game',
                    settingValue: game.name
                  })
                }
              >
                {game.name}
              </a>
            </li>
          ))}
        </ul>
      </>
    );
  }

  getThemesDropdown() {
    const { allThemes, themeIndex } = this.state;
    return (
      <>
        <a
          className="dropdown-trigger btn"
          href="#!"
          data-target="dropdownThemes"
        >
          {allThemes[themeIndex]}
          <i className="material-icons">arrow_downward</i>
        </a>

        <ul id="dropdownThemes" className="dropdown-content">
          {allThemes.map((theme) => (
            <li key={theme}>
              <a
                href="#!"
                onClick={(e) =>
                  this.changeSetting(e, {
                    settingName: 'game_theme',
                    settingValue: theme
                  })
                }
              >
                {theme}
              </a>
            </li>
          ))}
        </ul>
      </>
    );
  }

  async changeSetting(e, args) {
    e.preventDefault();
    const { currentConfigIndex, allThemes } = this.state;
    const { settingName, settingValue } = args;

    const updatedConfigs = await ipcRenderer.invoke(
      appEvents.config.CHANGE_CONFIG,
      {
        gameIndex: currentConfigIndex,
        setting: {
          name: settingName,
          value: settingValue != null ? settingValue : null
        }
      }
    );

    if (updatedConfigs != null) {
      const { appConfig, gamesConfig } = updatedConfigs;

      const updatedConfigIndex = gamesConfig.games.findIndex(
        (game) => game.name === gamesConfig.selectedGame
      );

      const themeIndex = allThemes.findIndex(
        (theme) => theme === gamesConfig.games[updatedConfigIndex].theme
      );

      this.setState({
        appConfig,
        gamesConfig,
        currentConfigIndex: updatedConfigIndex,
        themeIndex
      });

      if (settingName === 'game_theme' || settingName === 'current_game') {
        await this.setTheme();
      }
    }
  }

  displayConfig() {
    const { appConfig } = this.state;

    return (
      <div className="row">
        <div className="col s12">
          <h5>
            <b>Game: </b>
            {this.getGamesDropdown()}
          </h5>
          <h5>
            <b>Show Debug Messages: </b>
            <span>
              <label htmlFor="showDebugCheck">
                <input
                  type="checkbox"
                  className="filled-in"
                  checked={appConfig.settings.showDebugMessages}
                  id="showDebugCheck"
                  onChange={(e) =>
                    this.changeSetting(e, {
                      settingName: 'show_debug',
                      settingValue: e.target.checked
                    })
                  }
                />
                <span htmlFor="showDebugCheck">Enabled</span>
              </label>
            </span>
          </h5>
          {this.getGameConfig()}
        </div>
      </div>
    );
  }

  render() {
    const { theme, appConfig, gamesConfig } = this.state;

    return (
      <div className={theme}>
        <div id="content-root">
          <div className="container layer-0 z-depth-2">
            {appConfig == null || gamesConfig == null ? (
              <LoadingBar loadingText="Loading Config..." />
            ) : (
              this.displayConfig()
            )}
          </div>
        </div>
      </div>
    );
  }
}
