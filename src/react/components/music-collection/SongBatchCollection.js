import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './MusicCollection.scss';

import { songDataProp } from '../../AppProps';

import SongItemSettings from './SongItemSettings';

export default class SongBatchCollection extends Component {
  songItems() {
    const { songs } = this.props;

    if (songs != null) {
      const items = songs.map((song, index) => (
        <SongItemSettings key={song.id} index={index} songData={song} isBatch />
      ));

      return items;
    }
    return null;
  }

  render() {
    // const { isEnabled, trackInfo, replacementExistence, updateTrackData } = this.props;
    const { name } = this.props;

    return (
      <div className="song-collection">
        <ul id="batch-header" className="collection with-header z-depth-1">
          <li className="collection-header">
            <h5>{name}</h5>
          </li>
          {this.songItems()}
        </ul>
      </div>
    );
  }
}

SongBatchCollection.propTypes = {
  name: PropTypes.string.isRequired,
  songs: PropTypes.arrayOf(songDataProp).isRequired
};
