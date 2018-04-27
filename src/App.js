import React, { Component } from 'react'
import web3 from './utils/web3'
import getCfdInstance from './ContractForDifference.js'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      web3: null,
      cfdInstance: null,
      accounts: 'Loading...',
      owner: 'Loading...',
      numberOfContracts: 'Loading...',
      contracts: [],
      makePosition: '0',
      makeAmountEther: '',
      makeEndBlock: '',
      message: 'Ready to make a transaction :)'
    }
  }

  async componentDidMount() {
    const cfdInstance = await getCfdInstance();

    let contracts = [];

    this.setState({
      web3: web3,
      cfdInstance: cfdInstance,
      accounts: await web3.eth.getAccounts(),
      owner: await cfdInstance.owner.call(),
      numberOfContracts: (await cfdInstance.numberOfContracts.call()).toString()
    });
    
    // Get array of array contracts and translate them to array of objects
    for(var i=0; i < this.state.numberOfContracts; i++){
      const contract = await cfdInstance.getCfd.call(i)
      contracts.push({
        maker: {addr: contract[0], position: contract[1].toString() === '0' ? 'Long' : 'Short'},
        taker: {addr: contract[2] === '0x0000000000000000000000000000000000000000' ? '' : contract[2], position: contract[2] === '0x0000000000000000000000000000000000000000' ? '' : (contract[3].toString() === '0' ? 'Long' : 'Short')},
        amount: web3.utils.fromWei(contract[4].toString(), 'ether'),
        contractStartBlock: contract[5].toString(),
        contractEndBlock: contract[6].toString()
      });
    }
    this.setState({
      contracts: contracts
    });
  }

  onMakeCfd = async (event) => {
    event.preventDefault();

    this.setState({ message: 'Waiting for Make CFD Transaction...' });

    await this.state.cfdInstance.makeCfd(
      this.state.accounts[0],
      this.state.makePosition,
      this.state.makeEndBlock,
      { value: web3.utils.toWei(this.state.makeAmountEther, 'ether'), from: this.state.accounts[0] }
    );

    this.setState({
      message: 'Make CFD Transaction successful!',
      makePosition: 0,
      makeAmountEther: ''
    });

  }

  render() {
    const ContractRow = (props) => {
      return (
        <tr>
          <td>
            { props.data.maker.addr }
          </td>
          <td>
            { props.data.maker.position }
          </td>
          <td>
            { props.data.taker.addr }
          </td>
          <td>
            { props.data.taker.position }
          </td>
          <td>
            { props.data.amount } Ether
          </td>
          <td>
            { props.data.contractStartBlock }
          </td>
          <td>
            { props.data.contractEndBlock }
          </td>
        </tr>
      );
    }

    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
          <a href="#" className="pure-menu-heading pure-menu-link">Contract For Difference</a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1">
              <h2>Contract general properties</h2>
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
                    <td>Web3 Selected Wallet</td>
                    <td>{this.state.accounts}</td>
                  </tr>
                  <tr>
                    <td>Contract Owner</td>
                    <td>{this.state.owner}</td>
                  </tr>
                  <tr>
                    <td>Number Of Contracts</td>
                    <td>{this.state.numberOfContracts}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="pure-u-1">
            <h2>Contract list</h2>
              <table className="pure-table pure-table-bordered">
                <thead>
                  <tr>
                    <th>Maker Address</th>
                    <th>MPosition</th>
                    <th>Taker Address</th>
                    <th>TPosition</th>
                    <th>Deposit</th>
                    <th>Start Block</th>
                    <th>End Block</th>
                  </tr>
                </thead>
                <tbody>
                {this.state.contracts.map(contract => {return <ContractRow data={contract} />})}
                </tbody>
              </table>
            </div>
            <div className="pure-u-1-2">
              <form onSubmit={this.onMakeCfd}>
                <h2>Make Contract</h2>
                <p>
                  <label>Position: </label>
                  <select
                    value={this.state.makePosition}
                    onChange={event => this.setState({ makePosition: event.target.value })}
                  >
                    <option value="0">Long</option>
                    <option value="1">Short</option>
                  </select>
                </p>
                <p>
                  <label>Amount of Ether: </label>
                  <input
                    value={this.state.makeAmountEther}
                    onChange={event => this.setState({ makeAmountEther: event.target.value })}
                  />
                </p>
                <p>
                  <label>End Block: </label>
                  <input
                    value={this.state.makeEndBlock}
                    onChange={event => this.setState({ makeEndBlock: event.target.value })}
                  />
                </p>
                <button>Make Contract for Difference</button>
              </form>
            </div>
            <div className="pure-u-1-2"></div>

            <div className="pure-u-1">
              <hr />
              <h2>Status: {this.state.message}</h2>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App
