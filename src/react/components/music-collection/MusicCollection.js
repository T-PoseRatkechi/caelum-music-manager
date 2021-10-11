import React from 'react';
import './MusicCollection.scss';

import { musicDataProp } from '../../AppProps';
import CategoryCollection from './CategoryCollection';

const MusicCollection = (props) => {
  const { musicData } = props;

  if (musicData != null) {
    return (
      <div className="row music-collection">
        <CategoryCollection musicData={musicData} />
      </div>
    );
  }
  return <h1>Error, music data null!</h1>;
};

MusicCollection.propTypes = {
  musicData: musicDataProp.isRequired
};

export default MusicCollection;
