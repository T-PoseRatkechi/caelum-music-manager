import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { songDataProp } from '../../AppProps';

import SongItem from './SongItem';

export default class SongCategoryCollection extends Component {
  songItems() {
    const { songs } = this.props;

    const items = songs.map((song, index) => (
      <SongItem key={song.id} index={index} songData={song} />
    ));

    return items;
  }

  render() {
    // const { isEnabled, trackInfo, replacementExistence, updateTrackData } = this.props;
    const { name } = this.props;

    return (
      <div className="col s4 song-collection">
        <ul className="collection with-header z-depth-1">
          <li className="collection-header">
            <h5>{name}</h5>
          </li>
          {this.songItems()}
        </ul>
      </div>
    );
  }
}

SongCategoryCollection.propTypes = {
  name: PropTypes.string.isRequired,
  songs: PropTypes.arrayOf(songDataProp).isRequired
};
