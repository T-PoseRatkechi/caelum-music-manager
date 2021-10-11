import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Switch, Route } from 'react-router-dom';

import './index.css';
import App from './react/App';
import ConfigView from './react/ConfigView';
import BatchView from './react/BatchView';

ReactDOM.render(
  <React.StrictMode>
    <HashRouter>
      <Switch>
        <Route path="/batchsettings">
          <BatchView />
        </Route>
        <Route path="/config">
          <ConfigView />
        </Route>
        <Route path="/">
          <App />
        </Route>
      </Switch>
    </HashRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

function handleNonLeftClick(e) {
  if (e.button === 1) {
    if (
      e.target.tagName.toLowerCase() === 'a' ||
      e.target.tagName.toLowerCase() === 'i'
    ) {
      e.preventDefault();
    }
  }
}

window.onload = () => {
  document.addEventListener('auxclick', handleNonLeftClick);
  document.addEventListener('click', (e) => {
    if (e.target.tagName.toLowerCase() === 'a') {
      if (e.target.href.endsWith('#!')) {
        e.preventDefault();
      }
    }
  });
};
