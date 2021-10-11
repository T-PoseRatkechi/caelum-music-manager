import React, { Component } from 'react';
import PropTypes from 'prop-types';
import log from 'loglevel';

import logo from '../../icon_512.png';

import { channels } from '../../../shared/constants';

const { ipcRenderer } = window;
export default class NavBar extends Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
    this.state = {
      generatingBuild: false
    };
  }

  handleClick(origin) {
    switch (origin) {
      case 'create':
        log.info('React: Generate XWB button clicked!');
        this.setState({ generatingBuild: true });
        ipcRenderer
          .invoke(channels.GENERATE_BUILD)
          .then(() => {
            this.setState({ generatingBuild: false });
          })
          .catch(() => {
            this.setState({ generatingBuild: false });
          });
        break;
      default:
        break;
    }
  }

  render() {
    const { generatingBuild } = this.state;
    const { gameName } = this.props;

    return (
      <header>
        <nav className="layer-1">
          <div className="col-12">
            <a href="#!" className="brand-logo left">
              <img
                className="responsive-img"
                style={{ width: 85 }}
                src={logo}
                alt=""
              />
            </a>
            <ul id="nav-mobile" className="right hide-on-small-only">
              <li className="clickable-icon" title={`Building for ${gameName}`}>
                {gameName}
              </li>
              <li>
                <a
                  href="#!"
                  className={`btn-floating ${
                    generatingBuild ? 'disabled' : ''
                  }`}
                  onClick={() => this.handleClick('create')}
                  title="Create Music Build"
                >
                  <i className="material-icons">create</i>
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </header>
    );
  }
}

NavBar.propTypes = {
  gameName: PropTypes.string.isRequired
};
