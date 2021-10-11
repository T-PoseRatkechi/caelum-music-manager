import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { songDataProp } from '../../AppProps';

import SongItemInfo from './SongItemInfo';
import SongItemSettings from './SongItemSettings';

export default class SongItem extends Component {
  constructor(props) {
    super(props);
    this.toggleSettingsView = this.toggleSettingsView.bind(this);

    this.state = {
      showSongSettings: false,

      renderSettings: false
    };
  }

  componentDidUpdate(prevProps) {
    const { songData } = this.props;
    const { songData: prevSongData } = prevProps;

    if (prevSongData.replacementFilePath !== songData.replacementFilePath) {
      const { renderSettingsTimeout } = this.state;
      clearTimeout(renderSettingsTimeout);
      // Should be fine since it's conditioned.
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        showSongSettings: false,

        renderSettings: false
      });
    }
  }

  /**
   * Sets a timeout to stop rendering settings after some time.
   */
  setRenderSettingsTimeout() {
    setTimeout(() => {
      this.setState({
        renderSettings: false
      });
    }, 100);
  }

  /**
   * Toggles whether to display SongInfo or SongSettings.
   * Also responsible for toggling the rendering of SongSettings.
   * Was done to get around a bug that caused SongSettings CSS to not refresh
   * correctly on updates. Also probably improves performance.
   */
  toggleSettingsView() {
    this.setState((state) => {
      // Stop displaying settings.
      if (state.showSongSettings === true) {
        // Set settings render timeout.
        this.setRenderSettingsTimeout();
        return {
          showSongSettings: false
        };
      }

      // Display settings. Also enable rendering settings.
      return {
        showSongSettings: true,
        renderSettings: true
      };
    });
  }

  render() {
    const { index, songData } = this.props;
    const { showSongSettings, renderSettings } = this.state;

    return (
      <div>
        <div
          className={`song-settings-side scale-transition ${
            showSongSettings ? 'scale-in' : 'scale-out'
          }`}
        >
          {renderSettings ? (
            <SongItemSettings
              index={index}
              songData={songData}
              toggleSettings={this.toggleSettingsView}
              isBatch={false}
            />
          ) : (
            ''
          )}
        </div>
        <SongItemInfo
          index={index}
          songData={songData}
          toggleSettings={this.toggleSettingsView}
        />
      </div>
    );
  }
}

SongItem.propTypes = {
  index: PropTypes.number.isRequired,
  songData: songDataProp.isRequired
};
