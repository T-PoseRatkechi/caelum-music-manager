import React, { Component } from 'react';

import './GameSelect.scss';

import { appEvents } from '../../../shared/constants';

const { ipcRenderer } = window;

const inDev = process.env.NODE_ENV === 'development';

// https://stackoverflow.com/q/42118296
function importAll(r) {
  const images = {};
  r.keys().forEach((item) => {
    images[item.replace('./', '')] = r(item);
  });
  return images;
}

const images = inDev
  ? importAll(
      require.context(
        '../../images/placeholder/game-previews',
        false,
        /\.(png|jpe?g|svg)$/
      )
    )
  : importAll(
      require.context('../../images/game-previews', false, /\.(png|jpe?g|svg)$/)
    );

export default class GameSelect extends Component {
  static async selectGameClick(e, args) {
    const { gameName } = args;

    ipcRenderer.invoke(appEvents.config.CHANGE_CONFIG, {
      gameIndex: -1,
      setting: {
        name: 'current_game',
        value: gameName
      }
    });
  }

  constructor(props) {
    super(props);

    this.state = {
      gamesConfig: null
    };
  }

  async componentDidMount() {
    const currentConfig = await ipcRenderer.invoke(
      appEvents.config.request.GAMES_CONFIG
    );

    this.setState({
      gamesConfig: currentConfig
    });
  }

  static getPreviewPath(gameName) {
    if (`${gameName}.png` in images) {
      return images[`${gameName}.png`];
    }

    return images['missing-preview.png'];
  }

  static getGameCard(game) {
    const gameSupported = game.settings.supportedFiletypes.length >= 1;

    const cardContent = gameSupported ? (
      <p>
        <b>Ready: </b>
        {game.installed ? 'Yes' : 'No'}
        <br />
        <b>Encoded Format: </b>
        {game.settings.encodedFormat}
        <br />
        <b>Supported Filetypes: </b>
        {game.settings.supportedFiletypes.join(', ')}
      </p>
    ) : (
      <p>
        <b>Game Unsupported</b>
      </p>
    );

    return (
      <div key={game.name} className="col s3">
        <div className="card medium">
          <div className="card-image valign-wrapper">
            <img
              src={GameSelect.getPreviewPath(game.name)}
              alt=""
              draggable="false"
            />
            <span className="card-title">{game.name}</span>
          </div>
          <div className="card-content">{cardContent}</div>
          <div className="card-action">
            {gameSupported ? (
              <a
                href="#!"
                onClick={(e) =>
                  GameSelect.selectGameClick(e, { gameName: game.name })
                }
              >
                Select
              </a>
            ) : (
              <b>Disabled</b>
            )}
          </div>
        </div>
      </div>
    );
  }

  gameSelectScreen() {
    const { gamesConfig } = this.state;

    return (
      <div className="game-select">
        <div className="row">
          <h3 className="center-align">Caelum Music Manager</h3>
          {gamesConfig.games.map((game) => GameSelect.getGameCard(game))}
        </div>
      </div>
    );
  }

  render() {
    const { gamesConfig } = this.state;

    const content = gamesConfig == null ? '' : this.gameSelectScreen();

    return content;
  }
}
