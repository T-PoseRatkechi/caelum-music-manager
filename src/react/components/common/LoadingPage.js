import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import LoadingBar from './LoadingBar';
import './LoadingPage.scss';

export default class LoadingPage extends PureComponent {
  render() {
    const { text, isLoading } = this.props;
    return (
      <div className={isLoading ? 'loading-page' : 'loading-page fade-out'}>
        <LoadingBar loadingText={text} />
      </div>
    );
  }
}

LoadingPage.propTypes = {
  text: PropTypes.string.isRequired,
  isLoading: PropTypes.bool.isRequired
};
