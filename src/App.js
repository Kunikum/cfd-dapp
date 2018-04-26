import React, { Component } from 'react'
import ContractForDifference from '../build/contracts/ContractForDifference.json'
import getWeb3 from './utils/getWeb3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      web3: null,
      owner: 'Loading...'
    }
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
      .then(results => {
        this.setState({
          web3: results.web3
        })
        console.log(results.web3)
        // Instantiate contract once web3 provided.
        this.instantiateContract()
      })
      .catch(() => {
        console.log('Error finding web3.')
      })
  }

  instantiateContract() {
    /*
     * SMART CONTRACT EXAMPLE
     *
     * Normally these functions would be called in the context of a
     * state management library, but for convenience I've placed them here.
     */

    const contract = require('truffle-contract')
    const contractForDifference = contract(ContractForDifference)
    contractForDifference.setProvider(this.state.web3.currentProvider)

    // Declaring this for later so we can chain functions on SimpleStorage.
    var contractForDifferenceInstance

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      contractForDifference.deployed().then((instance) => {
        contractForDifferenceInstance = instance

        // Stores a given value, 5 by default.
        //   return contractForDifferenceInstance.set(5, {from: accounts[0]})
        // }).then((result) => {
        // Get the value from the contract to prove it worked.
        return contractForDifferenceInstance.owner.call(accounts[0])
      }).then((result) => {
        // Update state with the result.
        console.log(JSON.stringify(result));
        return this.setState({ owner: result })
      })
    })
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
                    <td></td>
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
