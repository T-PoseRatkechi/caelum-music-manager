import React from 'react';

import { appEvents } from '../shared/constants';

import './scss/AppTheme.scss';

import NavBar from './components/main/NavBar';
import LoadingPage from './components/common/LoadingPage';
import MusicCollection from './components/music-collection/MusicCollection';
import OutputBox from './components/main/OutputBox';
import GameSelect from './components/main/GameSelect';

const { ipcRenderer } = window;

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      theme: 'defaultDark',

      isLoading: true,
      loadFadeTimeout: null,
      loadingMessage: 'Loading Caelum Music Manager...',

      musicManagerLoaded: false,
      musicData: null
    };
  }

  async componentDidMount() {
    ipcRenderer.on(appEvents.app.STATUS_UPDATE, async (e, args) => {
      const { status, message } = args;

      switch (status) {
        // App finished loading.
        case 'SUCCESS': {
          ipcRenderer
            .invoke(appEvents.config.request.MUSIC_DATA)
            .then(async (musicData) => {
              this.setState({
                loadingMessage: message,
                isLoading: false,
                musicData,
                musicManagerLoaded: true
              });

              await this.setTheme();
              this.registerDataListeners();

              ipcRenderer.removeAllListeners(appEvents.app.STATUS_UPDATE);
            })
            .catch(() => {
              this.setState({
                loadingMessage:
                  'Problem loading music data! Check app.log in the settings folder for more details!',
                isLoading: true
              });
            });
          break;
        }
        // App failed to load.
        case 'ERROR':
          this.setState({
            isLoading: true,
            loadingMessage: message
          });
          break;
        case 'STATUS':
        default:
          this.setState({
            loadingMessage: message
          });
          break;
      }
    });

    ipcRenderer.send(appEvents.app.STATUS_UPDATE, { status: 'READY' });
  }

  async setTheme() {
    const themeClass = await ipcRenderer.invoke(
      appEvents.config.request.GAME_THEME
    );

    this.setState({
      theme: themeClass
    });
  }

  // Set loading transition.
  setLoadFade() {
    const { loadFadeTimeout } = this.state;
    clearTimeout(loadFadeTimeout);
    this.setState({
      isLoading: true,
      loadFadeTimeout: setTimeout(() => {
        this.setState({
          isLoading: false
        });
      }, 100)
    });
  }

  // Set constant listeners.
  registerDataListeners() {
    // Set new music data on changes made.
    ipcRenderer.on(appEvents.config.updates.MUSIC_DATA, (e, args) => {
      const { updatedMusicData } = args;

      if (updatedMusicData != null) {
        this.setState({
          musicData: updatedMusicData
        });
      }
    });

    // Set new theme on changes made.
    ipcRenderer.on(appEvents.config.updates.CONFIG, (e, args) => {
      const { updatedSettings } = args;

      this.setLoadFade();

      if (updatedSettings.theme != null) {
        this.setState({
          loadingMessage: 'Changing Theme...',
          theme: updatedSettings.theme
        });
      }

      if ('musicData' in updatedSettings) {
        const message =
          updatedSettings.musicData != null
            ? 'Loading Music...'
            : 'Loading Game Select...';
        this.setState({
          loadingMessage: message,
          musicData: updatedSettings.musicData
        });
      }
    });
  }

  gameSelect() {
    const { musicData, musicManagerLoaded } = this.state;

    if (musicManagerLoaded && musicData == null) {
      return <GameSelect />;
    }

    return null;
  }

  content() {
    const { musicData } = this.state;

    return (
      <>
        <div className="row">
          <NavBar gameName={musicData != null ? musicData.game : ''} />
          <OutputBox />
        </div>
        <div className="container">
          {musicData != null ? (
            <MusicCollection musicData={musicData} />
          ) : (
            'No Music Data Loaded...'
          )}
        </div>
      </>
    );
  }

  render() {
    const { isLoading, theme, loadingMessage } = this.state;

    return (
      <div className={theme}>
        <div id="content-root">
          <LoadingPage text={loadingMessage} isLoading={isLoading} />
          {this.gameSelect()}
          <div className="container layer-0 z-depth-2">{this.content()}</div>
        </div>
      </div>
    );
  }
}
