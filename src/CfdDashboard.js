import React, { Component } from 'react'
import web3 from './utils/web3'
import { getCfdInstance, getApoInstance } from './utils/ContractLoader'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class CfdDashboard extends Component {
  constructor(props) {
    super(props)

    this.state = {
      web3: null,
      currentBlockNumber: 0,
      cfdInstance: null,
      accounts: 'Loading...',
      oracleOwner: 'Loading...',
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
    const apoInstance = await getApoInstance();

    this.setState({
      web3: web3,
      currentBlockNumber: await web3.eth.getBlockNumber(),
      cfdInstance: cfdInstance,
      accounts: await web3.eth.getAccounts(),
      oracleOwner: await apoInstance.owner.call(),
      numberOfContracts: (await cfdInstance.numberOfContracts.call()).toString()
    });

    // Get array of array contracts and translate them to array of objects.
    // We do this in the order of highest to lowest ID, so we get newest contracts loaded first.
    let contracts = [];
    for (let i = this.state.numberOfContracts - 1; i >= 0; i--) {
      const contract = await cfdInstance.getCfd.call(i);

      contracts.unshift({
        id: i,
        maker: {
          addr: contract[0],
          position: contract[1].toString() === '0' ? 'Long' : 'Short'
        },
        taker: {
          addr: contract[2] === '0x0000000000000000000000000000000000000000' ? '' : contract[2],
          position: contract[2] === '0x0000000000000000000000000000000000000000' ? '' : (contract[3].toString() === '0' ? 'Long' : 'Short')
        },
        amount: web3.utils.fromWei(contract[4].toString(), 'ether'),
        contractStartBlock: contract[5].toNumber(),
        contractEndBlock: contract[6].toNumber(),
        isTaken: contract[7],
        isSettled: contract[8]
      });

      this.setState({
        contracts: contracts
      });
    }
  }

  onMakeCfd = async (event) => {
    event.preventDefault();

    this.setState({ message: 'Waiting for Make CFD Transaction to confirm...' });

    console.log('cfdInstance.makeCfd.estimateGas', await this.state.cfdInstance.makeCfd.estimateGas(
      this.state.accounts[0],
      0,
      this.state.makePosition,
      this.state.makeEndBlock,
      { value: web3.utils.toWei(this.state.makeAmountEther, 'ether'), from: this.state.accounts[0] }
    ));

    await this.state.cfdInstance.makeCfd(
      this.state.accounts[0],
      0,
      this.state.makePosition,
      this.state.makeEndBlock,
      { value: web3.utils.toWei(this.state.makeAmountEther, 'ether'), from: this.state.accounts[0] }
    );

    this.setState({
      message: '\'Make CFD\' Transaction successful!',
      makePosition: 0,
      makeAmountEther: ''
    });
  };

  onTakeCfd = async (cfdId, event) => {
    event.preventDefault();

    const cfd = this.state.contracts.find((c) => { return c.id === cfdId; });

    console.log('cfdInstance.takeCfd.estimateGas', await this.state.cfdInstance.takeCfd.estimateGas(
      cfdId,
      this.state.accounts[0],
      { value: web3.utils.toWei(cfd.amount, 'ether'), from: this.state.accounts[0] }
    ));

    this.setState({ message: 'Waiting for Take CFD Transaction to confirm...' });
    await this.state.cfdInstance.takeCfd(
      cfdId,
      this.state.accounts[0],
      { value: web3.utils.toWei(cfd.amount, 'ether'), from: this.state.accounts[0] }
    );

    this.setState({ message: '\'Take CFD\' Transaction successful!' });
  };

  onSettleCfd = async (cfdId, event) => {
    event.preventDefault();

    console.log('cfdInstance.settleCfd.estimateGas', await this.state.cfdInstance.settleCfd.estimateGas(
      cfdId,
      { from: this.state.accounts[0] }
    ));

    this.setState({ message: 'Waiting for Settle CFD Transaction to confirm...' });

    await this.state.cfdInstance.settleCfd(
      cfdId,
      { from: this.state.accounts[0] }
    );

    this.setState({ message: '\'Settle CFD\' Transaction successful!' });
  };

  render() {
    const ContractRow = (props) => {
      const disableTake = props.data.isTaken || this.state.currentBlockNumber >= props.data.contractEndBlock;
      const disableSettle = !props.data.isTaken || props.data.isSettled || this.state.currentBlockNumber < props.data.contractEndBlock - 1;
      return (
        <tr>
          <td>
            {props.data.id}
          </td>
          <td title={props.data.maker.addr}>
            {props.data.maker.addr.substring(0, 8) + "..."}
          </td>
          <td>
            {props.data.maker.position}
          </td>
          <td title={props.data.taker.addr}>
            {props.data.taker.addr ? props.data.taker.addr.substring(0, 8) + "..." : ''}
          </td>
          <td>
            {props.data.taker.position}
          </td>
          <td>
            {props.data.amount}
          </td>
          <td>
            {props.data.contractStartBlock !== 0 ? props.data.contractStartBlock : ''}
          </td>
          <td>
            {props.data.contractEndBlock}
          </td>
          <td>
            <button onClick={(e) => this.onTakeCfd(props.data.id, e)} className="pure-button" disabled={disableTake}>Take</button>
            <button onClick={(e) => this.onSettleCfd(props.data.id, e)} className="pure-button" disabled={disableSettle}>Settle</button>
          </td>
        </tr>
      );
    }

    return (
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
                <td>Web3 Selected Wallet</td>
                <td>{this.state.accounts}</td>
              </tr>
              <tr>
                <td>Contract Owner</td>
                <td>{this.state.oracleOwner}</td>
              </tr>
              <tr>
                <td>Current Block</td>
                <td>{this.state.currentBlockNumber}</td>
              </tr>
              <tr>
                <td>Number Of Contracts</td>
                <td>{this.state.numberOfContracts}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pure-u-1">
          <form onSubmit={this.onMakeCfd} className="pure-form pure-form-stacked">
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
            <button className="pure-button pure-button-primary">Make Contract for Difference</button>
          </form>
        </div>

        <div className="pure-u-1">
          <h2>Contract list</h2>
          <table className="pure-table pure-table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Maker Addr</th>
                <th>MPosition</th>
                <th>Taker Addr</th>
                <th>TPosition</th>
                <th>Deposit (Ether)</th>
                <th>Start Block</th>
                <th>End Block</th>
                <th>Options</th>
              </tr>
            </thead>
            <tbody>
              {/* '.slice(0)' is used to create a shallow copy, so '.reverse()' does not change the original data
                *  'key' value is just to stop the React warning of missing unique key 
                */ }
              {this.state.contracts.slice(0).reverse().map(contract => { return <ContractRow data={contract} key={contract.id} /> })}
            </tbody>
          </table>
        </div>

        <div className="pure-u-1">
          <hr />
          <h2>Status: {this.state.message}</h2>
        </div>
      </div>
    );
  }
}

export default CfdDashboard
