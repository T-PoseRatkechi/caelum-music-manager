import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import './SelectItemButton.scss';

export default class SelectItemButton extends PureComponent {
  render() {
    const { itemName, itemIcon, onClick } = this.props;
    return (
      <div className="button">
        <a
          href="#!"
          className="waves-effect waves-light btn-small"
          title={itemName}
          onClick={onClick}
        >
          <i className="material-icons left">{itemIcon}</i>SELECT
        </a>
      </div>
    );
  }
}

SelectItemButton.propTypes = {
  itemName: PropTypes.string.isRequired,
  itemIcon: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};
