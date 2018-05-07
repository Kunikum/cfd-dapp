import React, { Component } from 'react'
import web3 from './utils/web3'
import getCfdInstance from './ContractForDifference.js'
import { BigNumber } from 'bignumber.js';

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class PriceOracleDashboard extends Component {
  constructor(props) {
    super(props)

    this.state = {
      web3: null,
      currentBlockNumber: 0,
      cfdInstance: null,
      accounts: 'Loading',
      owner: 'Loading...',
      priceRecords: [],
      registerBlockNo: '',
      registerPrice: '',
      message: 'Ready to make a transaction :)'
    }
  }

  async componentDidMount() {
    const cfdInstance = await getCfdInstance();

    this.setState({
      web3: web3,
      currentBlockNumber: await web3.eth.getBlockNumber(),
      cfdInstance: cfdInstance,
      accounts: await web3.eth.getAccounts(),
      owner: await cfdInstance.owner.call(),

    });

    // Get price quotes and translate them to array of objects
    let priceRecordObjects = [];
    const numberOfblocksWithPrice = await cfdInstance.getNumberOfBlocksWithPrice.call();
    for (let i = numberOfblocksWithPrice-1; i >= 0; i--) {
      const blockNumber = await cfdInstance.blocksWithPrice.call(i);
      const priceRecord = await cfdInstance.assetPriceRecords.call(blockNumber);
      priceRecordObjects.push({
        id: i,
        blockNumber: blockNumber,
        price: new BigNumber(priceRecord).dividedBy('1e18')
      });
      this.setState({
        priceRecords: priceRecordObjects
      });
    }
  }

  registerPrice = async (event) => {
    event.preventDefault();

    this.setState({ message: 'Waiting for Register Price Transaction to confirm...' });

    await this.state.cfdInstance.recordAssetPrice(
      this.state.registerBlockNo,
      new BigNumber(this.state.registerPrice).multipliedBy('1e18').toFixed(0),
      { from: this.state.accounts[0] }
    );

    this.setState({
      message: '\'Register Price\' Transaction successful!',
      registerBlockNo: '',
      registerPrice: ''
    });
  };

  render() {
    const PriceRecordRow = (props) => {
      return (
        <tr>
          <td>
            {props.data.id}
          </td>
          <td>
            {props.data.blockNumber.toString()}
          </td>
          <td>
            {props.data.price.toFixed(18)}
          </td>
        </tr>
      );
    }

    return (
      <div className="pure-g">

        <div className="pure-u-1-2">
          <h2>Price Quote list</h2>
          <table className="pure-table pure-table-bordered">
            <thead>
              <tr>
                <th>ID</th>
                <th>Block number</th>
                <th>Price Quote</th>
              </tr>
            </thead>
            <tbody>
              {this.state.priceRecords.map(priceRecord => { return <PriceRecordRow data={priceRecord} key={priceRecord.id} /> }) /* 'key' is just to stop the React warning of missing unique key */}
            </tbody>
          </table>
        </div>

        <div className="pure-u-1-2">
          <form onSubmit={this.registerPrice} className="pure-form pure-form-stacked">
            <h2>Register Price</h2>
            <p>
              <label>Block No: </label>
              <input
                value={this.state.registerBlockNo}
                onChange={event => this.setState({ registerBlockNo: event.target.value })}
              />
            </p>
            <p>
              <label>Price: </label>
              <input
                value={this.state.registerPrice}
                onChange={event => this.setState({ registerPrice: event.target.value })}
              />
            </p>
            <button className="pure-button pure-button-primary">Register Price</button>
          </form>
        </div>

      </div>
    );
  }
}

export default PriceOracleDashboard;