import PropTypes from 'prop-types';

const songDataProp = PropTypes.shape({
  id: PropTypes.string.isRequired,
  isEnabled: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  originalFile: PropTypes.string,
  replacementFilePath: PropTypes.string,
  loopStartSample: PropTypes.number.isRequired,
  loopEndSample: PropTypes.number.isRequired,
  outputFilePath: PropTypes.string.isRequired,
  extraData: PropTypes.string
});

const musicDataProp = PropTypes.shape({
  songs: PropTypes.arrayOf(songDataProp).isRequired
});

export { songDataProp, musicDataProp };
