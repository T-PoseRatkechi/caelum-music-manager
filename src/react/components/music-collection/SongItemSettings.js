import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { songDataProp } from '../../AppProps';

import { appEvents } from '../../../shared/constants';

const { config } = appEvents;

const { ipcRenderer } = window;

const MAX_INT = 2147483647;

export default class SongItemSettings extends Component {
  static validLoopSample(sample) {
    return (
      (!Number.isNaN(parseInt(sample, 10)) &&
        sample >= 0 &&
        sample < MAX_INT) ||
      sample === ''
    );
  }

  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);

    this.state = {
      loopTimeout: null,
      loopStartValue: 0,
      loopEndValue: 0
    };
  }

  componentDidMount() {
    const { songData } = this.props;
    this.setState({
      loopStartValue:
        songData.loopStartSample === 0 ? '' : songData.loopStartSample,
      loopEndValue: songData.loopEndSample === 0 ? '' : songData.loopEndSample
    });
  }

  componentDidUpdate(prevProps) {
    const { songData } = this.props;
    const { songData: prevSongData } = prevProps;

    if (prevSongData.replacementFilePath !== songData.replacementFilePath) {
      const { loopTimeout } = this.state;
      clearTimeout(loopTimeout);
      // Should be fine since it's conditioned.
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        loopTimeout: null,
        loopStartValue:
          songData.loopStartSample === 0 ? '' : songData.loopStartSample,
        loopEndValue: songData.loopEndSample === 0 ? '' : songData.loopEndSample
      });
    }
  }

  async handleClick(origin, e) {
    e.preventDefault();

    const { toggleSettings } = this.props;

    switch (origin) {
      case 'btn_showSettings':
        toggleSettings();
        break;
      default:
        break;
    }
  }

  handleChange(origin, e) {
    e.preventDefault();

    switch (origin) {
      case 'input_loopStart':
      case 'input_loopEnd': {
        const inputValue = e.target.value;
        if (SongItemSettings.validLoopSample(inputValue)) {
          const parsedInputValue =
            inputValue !== '' ? parseInt(inputValue, 10) : inputValue;

          if (origin === 'input_loopStart') {
            this.setState({ loopStartValue: parsedInputValue });
          } else {
            this.setState({ loopEndValue: parsedInputValue });
          }

          const { loopTimeout } = this.state;
          if (loopTimeout) {
            clearTimeout(loopTimeout);
            this.setState({
              loopTimeout: setTimeout(() => {
                this.sendLoopValue();
              }, 600)
            });
          } else {
            this.setState({
              loopTimeout: setTimeout(() => {
                this.sendLoopValue();
              }, 600)
            });
          }
        }
        break;
      }
      default:
        break;
    }
  }

  getSongFileButton() {
    const { songData } = this.props;
    if (songData.replacementFilePath == null) {
      return (
        <a
          href="#!"
          className="clickable-icon left"
          onClick={(e) => this.handleClick('btn_selectReplaceFile', e)}
          title="Select Replacement File"
        >
          <i className="material-icons">attach_file</i>
        </a>
      );
    }

    return (
      <a
        href="#!"
        className="clickable-icon left"
        onClick={(e) => this.handleClick('btn_removeReplaceFile', e)}
        title="Remove Replacement File"
      >
        <i className="material-icons">clear</i>
      </a>
    );
  }

  // Returns the file name from the given path.
  static getFileName(filePath) {
    const fileSplitArray = filePath.split('\\');
    return fileSplitArray[fileSplitArray.length - 1];
  }

  content() {
    const { loopStartValue, loopEndValue, loopTimeout } = this.state;
    const { songData, index } = this.props;

    const backgroundPattern = index % 2 ? 'bg-songitem-1' : 'bg-songitem-2';

    return (
      <li className={`collection-item avatar ${backgroundPattern} z-depth-0`}>
        <span
          className="song-item-info left"
          dir="rtl"
          title={songData.replacementFilePath}
        >
          <b>
            <div className="replacement-filepath">
              {songData.replacementFilePath}
            </div>
          </b>
        </span>
        <br />
        <div className="loops-form">
          <div
            className="input-field inline loop-input"
            title="Loop Start Sample"
          >
            <input
              id="loop-start"
              placeholder="Start Sample"
              value={loopStartValue}
              onChange={(e) => this.handleChange('input_loopStart', e)}
              disabled={songData.replacementFilePath === null}
            />
          </div>
          <div
            className="input-field inline loop-input"
            title="Loop End Sample"
          >
            <input
              id="loop-start"
              placeholder="End Sample"
              value={loopEndValue}
              onChange={(e) => this.handleChange('input_loopEnd', e)}
              disabled={songData.replacementFilePath === null}
            />
          </div>
        </div>
        <span className="anchor-container right">
          <div className="song-save-icon">
            <a
              href="#!"
              className="clickable-icon song-save-icon"
              onClick={(e) => this.handleClick('btn_showSettings', e)}
              title={loopTimeout ? 'Syncing Settings' : 'Settings Synced'}
            >
              <i className="small material-icons">
                {loopTimeout ? 'hourglass_full' : 'check_circle'}
              </i>
            </a>
          </div>
        </span>
      </li>
    );
  }

  sendLoopValue() {
    const { songData, isBatch } = this.props;
    const { loopStartValue, loopEndValue } = this.state;
    const newStartSample =
      loopStartValue === '' ? 0 : parseInt(loopStartValue, 10);
    const newEndSample = loopEndValue === '' ? 0 : parseInt(loopEndValue, 10);

    ipcRenderer.invoke(config.musicData.SONG_SET_LOOP, {
      songId: songData.id,
      startSample: newStartSample,
      endSample: newEndSample,
      isBatch
    });

    this.setState({ loopTimeout: null });
  }

  render() {
    return this.content();
  }
}

SongItemSettings.propTypes = {
  index: PropTypes.number.isRequired,
  songData: songDataProp.isRequired,
  toggleSettings: PropTypes.func,
  isBatch: PropTypes.bool.isRequired
};

SongItemSettings.defaultProps = {
  toggleSettings: () => {}
};
