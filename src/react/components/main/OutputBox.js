import React, { Component } from 'react';

import './OutputBox.scss';

import { channels } from '../../../shared/constants';

const { ipcRenderer } = window;

export default class OutputBox extends Component {
  constructor(props) {
    super(props);
    this.outputAreaRef = React.createRef();
    this.state = {
      outputText: 'Shuba Shuba Shuba!'
    };
  }

  componentDidMount() {
    this.setState({ outputText: OutputBox.getInitialMessage() });
    ipcRenderer.send(channels.OUTPUT_BOX);
    // on request received set new output text
    ipcRenderer.on(channels.OUTPUT_BOX, (event, arg) => {
      const { message } = arg;
      this.setState((state) => ({
        outputText: `${state.outputText}\n${message.toString()}`
      }));
      this.scrollToBottom();
    });
  }

  static getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  static getInitialMessage() {
    const messages = [
      'Shuba Shuba Shuba!',
      'SHUBA!!!!?',
      'Omae wa Mou Shuba Shuba',
      '*joyous quacking*',
      'Stream Heart Challenger'
    ];
    return messages[this.getRandomInt(messages.length)];
  }

  scrollToBottom() {
    if (this.outputAreaRef.current != null) {
      this.outputAreaRef.current.scrollTop = this.outputAreaRef.current.scrollHeight;
    }
  }

  render() {
    const { outputText } = this.state;

    return (
      <div className="row">
        <div className="col s10 offset-s1">
          <h6>
            <b>Output</b>
          </h6>
          <textarea
            id="output-box"
            ref={this.outputAreaRef}
            rows="5"
            value={outputText}
            readOnly
          />
        </div>
      </div>
    );
  }
}
