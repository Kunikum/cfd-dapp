import React, { Component } from 'react'
import web3 from './utils/web3'
import { getApoInstance } from './utils/ContractLoader'
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
      apoInstance: null,
      accounts: 'Loading',
      owner: 'Loading...',
      priceRecords: [],
      registerBlockNo: '',
      registerPrice: '',
      message: 'Ready to make a transaction :)'
    }
  }

  async componentDidMount() {
    const apoInstance = await getApoInstance();

    this.setState({
      web3: web3,
      currentBlockNumber: await web3.eth.getBlockNumber(),
      apoInstance: apoInstance,
      accounts: await web3.eth.getAccounts(),
      owner: await apoInstance.owner.call(),
    });

    // Get price quotes and translate them to array of objects
    let priceRecordObjects = [];

    apoInstance.AssetPriceRecorded({}, { fromBlock: 0, toBlock: 'latest' }).get(((error, result) => {
      result.forEach(assetPrice => {
        const assetId = assetPrice.args.assetId;
        const blockNumber = assetPrice.args.blockNumber;
        const price = new BigNumber(assetPrice.args.price).dividedBy('1e18')
        priceRecordObjects.push({ assetId, blockNumber, price });
      });
      this.setState({
        priceRecords: priceRecordObjects
      });
    }));
  }

  registerPrice = async (event) => {
    event.preventDefault();

    this.setState({ message: 'Waiting for Register Price Transaction to confirm...' });

    await this.state.apoInstance.recordAssetPrice(
      0,
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
            {props.data.assetId.toString()}
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
                <th>Asset ID</th>
                <th>Block number</th>
                <th>Price Quote</th>
              </tr>
            </thead>
            <tbody>
              {this.state.priceRecords.map(record => { return <PriceRecordRow data={record} key={record.assetId.toString() + record.blockNumber.toString()} /> }) /* 'key' is just to stop the React warning of missing unique key */}
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