import React, { Component } from 'react'
import web3 from './utils/web3'
import { getCfdInstance, getApoInstance } from './utils/ContractLoader'
import { getSettlements } from './utils/CfdUtils'

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
      makeAssetId: '',
      makePosition: '0',
      makeAmountEther: '',
      makeEndBlock: '',
      message: 'Ready to make a transaction :)'
    }
  }

  async componentDidMount() {
    const cfdInstance = await getCfdInstance();
    const apoInstance = await getApoInstance();
    const currentBlockNumber = await web3.eth.getBlockNumber();

    this.setState({
      web3: web3,
      currentBlockNumber: currentBlockNumber,
      cfdInstance: cfdInstance,
      accounts: await web3.eth.getAccounts(),
      oracleOwner: await apoInstance.owner.call(),
      numberOfContracts: (await cfdInstance.numberOfContracts.call()).toString(),
      makeEndBlock: currentBlockNumber + 40 // Suggest Make end block to be current block plus 10 minutes of blocks (4 blocks per minute * 10 minutes)
    });

    // Get array of array contracts and translate them to array of objects.
    // We do this in the order of highest to lowest ID, so we get newest contracts loaded first.
    let contracts = [];
    for (let i = this.state.numberOfContracts - 1; i >= 0; i--) {
      const contract = await cfdInstance.getCfd.call(i);
      
      const contractEndBlock = contract[7].toNumber();
      const isTaken = contract[8];
      const isSettled = contract[9];
      const isRefunded = contract[10];
      

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
        assetId: contract[4].toNumber(),
        amount: web3.utils.fromWei(contract[5].toString(), 'ether'),
        contractStartBlock: contract[6].toNumber(),
        contractEndBlock: contractEndBlock,
        isTaken: isTaken,
        isSettled: isSettled,
        isRefunded: isRefunded,
        status: this.getCfdState(isTaken, isSettled, isRefunded, contractEndBlock, currentBlockNumber)
      });

      this.setState({
        contracts: contracts
      });
    }

    console.log('await getSettlements():', await getSettlements(cfdInstance));
  }

  onMakeCfd = async (event) => {
    event.preventDefault();

    this.setState({ message: 'Waiting for Make CFD Transaction to confirm...' });

    console.log('cfdInstance.makeCfd.estimateGas', await this.state.cfdInstance.makeCfd.estimateGas(
      this.state.accounts[0],
      this.state.makeAssetId,
      this.state.makePosition,
      this.state.makeEndBlock,
      { value: web3.utils.toWei(this.state.makeAmountEther, 'ether'), from: this.state.accounts[0] }
    ));

    await this.state.cfdInstance.makeCfd(
      this.state.accounts[0],
      this.state.makeAssetId,
      this.state.makePosition,
      this.state.makeEndBlock,
      { value: web3.utils.toWei(this.state.makeAmountEther, 'ether'), from: this.state.accounts[0] }
    );

    this.setState({
      message: '\'Make CFD\' Transaction successful!',
      makeAssetId: '',
      makePosition: 0,
      makeAmountEther: '',
      makeEndBlock: ''
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

    console.log('onSettleCfd cfdId', cfdId);

    console.log('cfdInstance.settleCfd.estimateGas', await this.state.cfdInstance.settleCfd.estimateGas(
      cfdId,
      { from: this.state.accounts[0] }
    ));

    this.setState({ message: 'Waiting for Settle CFD Transaction to confirm...' });

    const settleCfdTx = await this.state.cfdInstance.settleCfd(
      cfdId,
      { from: this.state.accounts[0] }
    );

    const settlement = settleCfdTx.logs[0].args;
    console.log('Settled CFD:', {
      cfdId: settlement.cfdId.toNumber(),
      amount: settlement.amount.dividedBy('1e18').toNumber(),
      startPrice: settlement.startPrice.dividedBy('1e18').toNumber(),
      endPrice: settlement.endPrice.dividedBy('1e18').toNumber(),
      makerSettlement: settlement.makerSettlement.dividedBy('1e18').toNumber(),
      takerSettlement: settlement.takerSettlement.dividedBy('1e18').toNumber()
    });

    this.setState({ message: '\'Settle CFD\' Transaction successful!' });
  };

  onRefundCfd = async (cfdId, event) => {
    event.preventDefault();

    console.log('onRefundCfd cfdId', cfdId);

    console.log('cfdInstance.refundCfd.estimateGas', await this.state.cfdInstance.refundCfd.estimateGas(
      cfdId,
      { from: this.state.accounts[0] }
    ));

    this.setState({ message: 'Waiting for Refund CFD Transaction to confirm...' });

    const refundCfdTx = await this.state.cfdInstance.refundCfd(
      cfdId,
      { from: this.state.accounts[0] }
    );

    const refund = refundCfdTx.logs[0].args;
    console.log('Refunded CFD:', {
      cfdId: refund.cfdId.toNumber(),
      makerAddress: refund.makerAddress,
      amount: refund.amount.dividedBy('1e18').toNumber()
    });

    this.setState({ message: '\'Refund CFD\' Transaction successful!' });
  };

  render() {
    const ContractRow = (props) => {
      const disableTake = props.data.isTaken || props.data.isRefunded || this.state.currentBlockNumber >= props.data.contractEndBlock;
      const disableSettle = !props.data.isTaken || props.data.isSettled || props.data.isRefunded || this.state.currentBlockNumber < props.data.contractEndBlock - 1;
      const disableRefund = props.data.isTaken || props.data.isSettled || props.data.isRefunded || props.data.maker.addr.toLowerCase() !== this.state.accounts[0].toLowerCase();
      return (
        <tr>
          <td>
            {props.data.id}
          </td>
          <td>
            {props.data.assetId}
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
            {props.data.status}
          </td>
          <td>
            <button onClick={(e) => this.onTakeCfd(props.data.id, e)} className="pure-button" disabled={disableTake}>Take</button>
            <button onClick={(e) => this.onSettleCfd(props.data.id, e)} className="pure-button" disabled={disableSettle}>Settle</button>
            <button onClick={(e) => this.onRefundCfd(props.data.id, e)} className="pure-button" disabled={disableRefund}>Refund</button>
          </td>
        </tr>
      );
    }

    return (
      <div>

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
                <label>Asset ID: </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  onKeyPress={event => event.charCode >= 48 && event.charCode <= 57}
                  value={this.state.makeAssetId}
                  onChange={event => this.setState({ makeAssetId: event.target.value })}
                />
              </p>
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
                  type="number"
                  min="0"
                  step="1"
                  onKeyPress={event => event.charCode >= 48 && event.charCode <= 57}
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
                  <th>Asset ID</th>
                  <th>Maker Addr</th>
                  <th>MPosition</th>
                  <th>Taker Addr</th>
                  <th>TPosition</th>
                  <th>Deposit (Ether)</th>
                  <th>Start Block</th>
                  <th>End Block</th>
                  <th>Status</th>
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
        </div>

        <div className="buttom-bar">
          <div>Status: {this.state.message}</div>
        </div>

      </div>
    );
  }

  getCfdState(isTaken, isSettled, isRefunded, contractEndBlock, currentBlockNumber) {
    if (isSettled) {
      return 'Settled'
    } else if (isRefunded) {
      return 'Refunded'
    } else if (isTaken) {
      console.log('currentBlockNumber', currentBlockNumber)
      console.log('contractEndBlock', contractEndBlock)
      if (currentBlockNumber < contractEndBlock) {
        return 'Active'
      } else {
        return 'Finished'
      }
    } else {
      return 'Open'
    }
  }
}

export default CfdDashboard
