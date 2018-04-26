import React, { Component } from 'react'
import ContractForDifference from '../build/contracts/ContractForDifference.json'
import web3 from './utils/web3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      web3: null,
      accounts: 'Loading...',
      owner: 'Loading...'
    }
  }

  async componentDidMount() {
    const contract = require('truffle-contract');
    const cfd = contract(ContractForDifference);
    cfd.setProvider(web3.currentProvider);
    const cfdInstance = await cfd.deployed();

    this.setState({ 
      web3: web3,
      accounts: await web3.eth.getAccounts(),
      owner: await cfdInstance.owner.call()
    });
  }

  render() {
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
          <a href="#" className="pure-menu-heading pure-menu-link">Contract For Difference</a>
        </nav>

        <main className="container">
          <h1>Contract properties:</h1>
          <div className="pure-g">
            <div className="pure-u-1">
              <table className="pure-table pure-table-bordered">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Web3 version</td>
                    <td>{web3.version}</td>
                  </tr>
                  <tr>
                    <td>Web3 selected wallet</td>
                    <td>{this.state.accounts}</td>
                  </tr>
                  <tr>
                    <td>Contract owner</td>
                    <td>{this.state.owner}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="pure-u-1-3"><p>Pure CSS column 1</p></div>
            <div className="pure-u-1-3"><p>Pure CSS column 2</p></div>
            <div className="pure-u-1-3"><p>Pure CSS column 3</p></div>
          </div>
        </main>
      </div>
    );
  }
}

export default App
