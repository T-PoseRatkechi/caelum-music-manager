import React, { Component } from 'react';

import { musicDataProp } from '../../AppProps';

import SongCategoryCollection from './SongCategoryCollection';

export default class CategoryCollection extends Component {
  static maxSongsPerCategory = 5;

  categories() {
    const { musicData } = this.props;
    const categories = [];

    musicData.songs.forEach((song) => {
      if (song.category !== 'hidden') {
        const categoryIndex = categories.findIndex(
          (entry) => entry.name === song.category
        );
        // Existing category.
        if (categoryIndex >= 0) {
          const songsAmount = categories[categoryIndex].songs.length;
          // Calculate current song's expected group number.
          // Only allows a set amount of songs per collection.
          const songGroupNum =
            Math.floor(songsAmount / CategoryCollection.maxSongsPerCategory) +
            1;

          // If song is part of a new group of songs (maxSongsPerCategory)
          // update total amount of groups in Song's category.
          if (songGroupNum > categories[categoryIndex].totalGroups) {
            categories[categoryIndex].totalGroups = songGroupNum;
          }

          // Add song to list of songs in category.
          categories[categoryIndex].songs.push({
            songItem: song,
            songGroupNum
          });
        }
        // New category.
        else {
          categories.push({
            name: song.category,
            totalGroups: 1,
            songs: [{ songItem: song, songGroupNum: 1 }]
          });
        }
      }
    });

    return categories;
  }

  render() {
    const categories = this.categories();

    // Container for SongCollections.
    const categoryCollections = [];

    // Generate SongCollections.
    categories.forEach((category) => {
      // Category only has one group of songs.
      if (category.totalGroups === 1) {
        // Creates a single song collection with the collection name
        // lacking the group number, example: Battle Themes vs Battle Themes (1/1)
        categoryCollections.push(
          <SongCategoryCollection
            key={category.name}
            name={category.name}
            songs={category.songs.map((songEntry) => songEntry.songItem)}
          />
        );
      } else {
        // Generate song collections of each group of songs in category.
        for (let i = 0, total = category.songs.length; i < total; ) {
          // Create song collection containing songs from current group.
          // Gives song collection a name indicating it's group number out of total num groups.
          // Example: Battle Themes (1/2) and Battle Themes (2/2)
          categoryCollections.push(
            <SongCategoryCollection
              key={`${category.name}-${category.songs[i].songGroupNum}`}
              name={`${category.songs[i].songItem.category} (${category.songs[i].songGroupNum}/${category.totalGroups})`}
              songs={category.songs
                .slice(i, i + CategoryCollection.maxSongsPerCategory)
                .map((songEntry) => songEntry.songItem)}
            />
          );

          // Increase index to start of next song group in songs.
          i += CategoryCollection.maxSongsPerCategory;
        }
      }
    });

    return categoryCollections;
  }
}

CategoryCollection.propTypes = {
  musicData: musicDataProp.isRequired
};
