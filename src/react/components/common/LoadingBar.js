import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import './LoadingBar.css';

export default class LoadingBar extends PureComponent {
  render() {
    const { loadingText } = this.props;

    return (
      <div className="container-loading">
        <h5>{loadingText}</h5>
        <div className="progress">
          <div className="indeterminate" />
        </div>
      </div>
    );
  }
}

LoadingBar.propTypes = {
  loadingText: PropTypes.string.isRequired
};
