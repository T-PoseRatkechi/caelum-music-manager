import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { songDataProp } from '../../AppProps';

import { channels, appEvents } from '../../../shared/constants';

const { config } = appEvents;

const { ipcRenderer } = window;

export default class SongItemInfo extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  async handleClick(origin, e) {
    e.preventDefault();

    const { songData, toggleSettings } = this.props;

    switch (origin) {
      case 'btn_showSettings':
        toggleSettings();
        break;
      case 'btn_selectReplaceFile': {
        ipcRenderer.invoke(config.musicData.SONG_SET_REPLACEMENT, {
          songId: songData.id
        });
        break;
      }
      case 'btn_removeReplaceFile': {
        ipcRenderer.invoke(appEvents.config.musicData.SONG_REMOVE_REPLACEMENT, {
          songId: songData.id
        });
        break;
      }
      default:
        break;
    }
  }

  static handlePlayFile(source, filePath, e) {
    e.preventDefault();
    ipcRenderer.send(channels.PLAY_SONG, { source, filePath });
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
    const { songData, index } = this.props;

    const backgroundPattern = index % 2 ? 'bg-songitem-1' : 'bg-songitem-2';

    const content = (
      <li
        className={`collection-item avatar ${backgroundPattern} song-item-anim`}
        style={{ animationDelay: `${0.2 * index + 0.5}s` }}
      >
        <span className="song-item-info left" title={songData.name}>
          <b>{songData.name}</b>
        </span>
        <span
          className="anchor-container right"
          title={`Output: ${songData.outputFilePath}`}
        >
          <div className="file-id">
            <b>?</b>
          </div>
        </span>
        <br />
        <span
          className="file-name"
          title={
            songData.originalFile != null ? `Play ${songData.originalFile}` : ''
          }
        >
          {songData.originalFile != null ? (
            <a
              href="#!"
              onClick={(e) =>
                SongItemInfo.handlePlayFile(
                  'original',
                  songData.originalFile,
                  e
                )
              }
            >
              {songData.originalFile}
            </a>
          ) : (
            ''
          )}
        </span>
        <br />

        <span
          className="song-item-info left"
          title={songData.replacementFilePath}
          dir="rtl"
        >
          {this.getSongFileButton()}
          {songData.replacementFilePath != null ? (
            <a
              href="#!"
              onClick={(e) =>
                SongItemInfo.handlePlayFile(
                  'replacement',
                  songData.replacementFilePath,
                  e
                )
              }
            >
              <div className="replacement-filepath">
                {songData.replacementFilePath}
              </div>
            </a>
          ) : (
            ''
          )}
        </span>
        <span className="anchor-container right">
          <div
            className="song-settings-icon"
            hidden={songData.replacementFilePath == null}
          >
            <a
              href="#!"
              className="clickable-icon"
              onClick={(e) => this.handleClick('btn_showSettings', e)}
              title="Edit Song Settings"
            >
              <i className="small material-icons">settings</i>
            </a>
          </div>
        </span>
      </li>
    );

    return content;
  }

  render() {
    return <div className="song-info-side">{this.content()}</div>;
  }
}

SongItemInfo.propTypes = {
  index: PropTypes.number.isRequired,
  songData: songDataProp.isRequired,
  toggleSettings: PropTypes.func
};

SongItemInfo.defaultProps = {
  toggleSettings: () => {}
};
