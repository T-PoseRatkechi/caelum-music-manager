import React, { Component } from 'react';

import SongBatchCollection from './components/music-collection/SongBatchCollection';
import LoadingBar from './components/common/LoadingBar';

import { channels, appEvents } from '../shared/constants';

const { ipcRenderer } = window;
export default class BatchView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      theme: 'defaultDark',
      folderSongs: null
    };
  }

  async componentDidMount() {
    await this.setTheme();
    ipcRenderer.once(channels.BATCH_BUILD, (e, args) => {
      const { songs } = args;
      this.setState({
        folderSongs: songs
      });
    });
  }

  async setTheme() {
    const themeClass = await ipcRenderer.invoke(
      appEvents.config.request.GAME_THEME
    );
    this.setState({
      theme: themeClass
    });
  }

  render() {
    const { theme, folderSongs } = this.state;

    const contents = () => {
      if (folderSongs != null) {
        return (
          <div className="row music-collection">
            <div className="col s12">
              <SongBatchCollection songs={folderSongs} name="Batch Convert" />
            </div>
          </div>
        );
      }

      return <LoadingBar loadingText="Preparing Batch Converter..." />;
    };
    return (
      <div className={theme}>
        <div id="content-root">
          <div className="container layer-0 z-depth-2">{contents()}</div>
        </div>
      </div>
    );
  }
}
