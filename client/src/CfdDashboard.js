import React, { Component } from 'react';
import web3 from './utils/web3';
import { getCfdInstance, getApoInstance } from './utils/ContractLoader';
import { getSettlements, assetIdToString } from './utils/CfdUtils';
import CfdStatusPopup from './components/CfdStatusPopup';
import TakeCfdPopup from './components/TakeCfdPopup';
import CfdMakeForm from './components/CfdMakeForm';
import BlockWithPriceSubmit from './components/BlockWithPriceSubmit';

import './css/oswald.css';
import './css/open-sans.css';
import './css/pure-min.css';
import './App.css';

class CfdDashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentBlockNumber: 0,
      cfdInstance: null,
      apoInstance: null,
      accounts: 'Loading...',
      oracleOwner: 'Loading...',
      numberOfContracts: 'Loading...',
      contracts: [],
      message: 'Ready to make a transaction :)',
    };
  }

  async componentDidMount() {
    const cfdInstance = await getCfdInstance();
    const apoInstance = await getApoInstance();
    const currentBlockNumber = await web3.eth.getBlockNumber();
    const accounts = await web3.eth.getAccounts();

    this.setState({
      currentBlockNumber,
      cfdInstance,
      accounts,
      apoInstance,
      oracleOwner: await apoInstance.owner.call(),
      numberOfContracts: (await cfdInstance.numberOfContracts.call()).toString(),
    });

    // Get price quotes and translate them to array of objects
    const priceRecordObjects = [];

    apoInstance.AssetPriceRecorded({}, { fromBlock: 0, toBlock: 'latest' }).get(((error, result) => {
      result.forEach((assetPrice) => {
        const transactionBlockNumber = assetPrice.blockNumber;
        const assetId = assetPrice.args.assetId;
        const blockNumber = assetPrice.args.blockNumber;
        const price = assetPrice.args.price.div(1000000000000000000).toString(10);
        priceRecordObjects.push({
          transactionBlockNumber, assetId, blockNumber, price,
        });
      });
      this.setState({
        priceRecords: priceRecordObjects,
      });
    }));

    // Get array of array contracts and translate them to array of objects.
    // We do this in the order of highest to lowest ID, so we get newest contracts loaded first.
    const contracts = [];
    for (let i = this.state.numberOfContracts - 1; i >= 0; i -= 1) {
      const contract = await cfdInstance.getCfd.call(i);

      const contractEndBlock = contract[7].toNumber();
      const isTaken = contract[8];
      const isSettled = contract[9];
      const isRefunded = contract[10];


      contracts.unshift({
        id: i,
        maker: {
          addr: contract[0],
          position: contract[1].toString() === '0' ? 'Long' : 'Short',
        },
        taker: {
          addr: contract[2] === '0x0000000000000000000000000000000000000000' ? '' : contract[2],
          position: contract[2] === '0x0000000000000000000000000000000000000000' ? '' : (contract[3].toString() === '0' ? 'Long' : 'Short'),
        },
        assetId: contract[4].toNumber(),
        amount: web3.utils.fromWei(contract[5].toString(), 'ether'),
        contractStartBlock: contract[6].toNumber(),
        contractEndBlock,
        isTaken,
        isSettled,
        isRefunded,
        status: CfdDashboard.getCfdState(isTaken, isSettled, isRefunded, contractEndBlock, currentBlockNumber),
      });

      this.setState({
        contracts,
      });
    }

    // Add settlement info (if available) to contracts
    const settlements = await getSettlements(cfdInstance);
    this.setState({
      contracts: contracts.map((contract) => {
        const settlement = settlements.find(s => s.cfdId === contract.id);
        if (settlement) {
          return { ...contract, settlement };
        }
        return contract;
      }),
    });
  }

  onSettleAndWithdrawCfd = async (cfdId, event) => {
    event.preventDefault();

    console.log('onSettleAndWithdrawCfd cfdId', cfdId);

    console.log('cfdInstance.settleCfd.estimateGas', await this.state.cfdInstance.settleAndWithdrawCfd.estimateGas(
      cfdId,
      { from: this.state.accounts[0] },
    ));

    this.setState({ message: 'Waiting for Settle CFD Transaction to confirm...' });

    const settleAndWithdrawCfdTx = await this.state.cfdInstance.settleAndWithdrawCfd(
      cfdId,
      { from: this.state.accounts[0] },
    );

    const settlement = settleAndWithdrawCfdTx.logs[0].args;
    console.log('Settled CFD:', {
      cfdId: settlement.cfdId.toNumber(),
      amount: settlement.amount.dividedBy('1e18').toNumber(),
      startPrice: settlement.startPrice.dividedBy('1e18').toNumber(),
      endPrice: settlement.endPrice.dividedBy('1e18').toNumber(),
      makerSettlement: settlement.makerSettlement.dividedBy('1e18').toNumber(),
      takerSettlement: settlement.takerSettlement.dividedBy('1e18').toNumber(),
    });

    this.setState({ message: '\'Settle CFD\' Transaction successful!' });
  };

  onRefundCfd = async (cfdId, event) => {
    event.preventDefault();

    console.log('onRefundCfd cfdId', cfdId);

    console.log('cfdInstance.refundCfd.estimateGas', await this.state.cfdInstance.refundCfd.estimateGas(
      cfdId,
      { from: this.state.accounts[0] },
    ));

    this.setState({ message: 'Waiting for Refund CFD Transaction to confirm...' });

    const refundCfdTx = await this.state.cfdInstance.refundCfd(
      cfdId,
      { from: this.state.accounts[0] },
    );

    const refund = refundCfdTx.logs[0].args;
    console.log('Refunded CFD:', {
      cfdId: refund.cfdId.toNumber(),
      makerAddress: refund.makerAddress,
      amount: refund.amount.dividedBy('1e18').toNumber(),
    });

    this.setState({ message: '\'Refund CFD\' Transaction successful!' });
  };

  onTakeCfd = async (cfdId, takerAddress, event) => {
    console.log('cfdId', cfdId);
    console.log('takerAddress', takerAddress);
    console.log('event', event);
    event.preventDefault();

    const cfd = this.state.contracts.find(c => c.id === cfdId);

    console.log('cfdInstance.takeCfd.estimateGas', await this.state.cfdInstance.takeCfd.estimateGas(
      cfdId,
      takerAddress,
      { value: web3.utils.toWei(cfd.amount, 'ether'), from: this.state.accounts[0] },
    ));

    this.setState({ message: 'Waiting for Take CFD Transaction to confirm...' });
    await this.state.cfdInstance.takeCfd(
      cfdId,
      takerAddress,
      { value: web3.utils.toWei(cfd.amount, 'ether'), from: this.state.accounts[0] },
    );

    this.setState({ message: '\'Take CFD\' Transaction successful!' });
  };

  static getCfdState(isTaken, isSettled, isRefunded, contractEndBlock, currentBlockNumber) {
    if (isSettled) {
      return 'Settled';
    } if (isRefunded) {
      return 'Refunded';
    } if (isTaken) {
      if (currentBlockNumber < contractEndBlock) {
        return 'Active';
      }
      return 'Finished';
    } if (!isTaken && currentBlockNumber > contractEndBlock) {
      return 'Expired';
    }
    return 'Open';
  }

  render() {
    const ContractRow = (props) => {
      const disableTake = props.data.isTaken
        || props.data.isRefunded
        || this.state.currentBlockNumber >= props.data.contractEndBlock;
      const disableSettle = !props.data.isTaken
        || props.data.isSettled
        || props.data.isRefunded
        || this.state.currentBlockNumber < props.data.contractEndBlock - 1;
      const disableRefund = props.data.isTaken
        || props.data.isSettled
        || props.data.isRefunded
        || props.data.maker.addr.toLowerCase() !== this.state.accounts[0].toLowerCase();
      return (
        <tr>
          <td>
            {props.data.id}
          </td>
          <td>
            {assetIdToString(props.data.assetId)}
          </td>
          <td title={props.data.maker.addr}>
            {`${props.data.maker.addr.substring(0, 8)}...`}
            {' '}
            (
            <b>
              {props.data.maker.position}
            </b>
            )
          </td>
          <td title={props.data.taker.addr}>
            {props.data.taker.addr ? `${props.data.taker.addr.substring(0, 8)}...` : ''}
            {' '}
            <b>
              {props.data.taker.position ? `(${props.data.taker.position})` : ''}
            </b>
          </td>
          <td>
            {props.data.amount}
          </td>
          <td>
            {props.data.contractStartBlock !== 0 ? (
              <BlockWithPriceSubmit
                apoInstance={this.state.apoInstance}
                priceRecords={this.state.priceRecords}
                currentAccount={this.state.accounts[0]}
                assetId={props.data.assetId}
                blockNo={props.data.contractStartBlock}
              />
            ) : ('')
            }
          </td>
          <td>
            <BlockWithPriceSubmit
              apoInstance={this.state.apoInstance}
              priceRecords={this.state.priceRecords}
              currentAccount={this.state.accounts[0]}
              assetId={props.data.assetId}
              blockNo={props.data.contractEndBlock}
            />
          </td>
          <td>
            {props.data.status}
            {' '}
            <CfdStatusPopup cfd={props.data} />
          </td>
          <td>
            <TakeCfdPopup takeCfdHandler={this.onTakeCfd} cfdId={props.data.id} takerAddress={this.state.accounts[0]} disabled={disableTake} />
            <button onClick={e => this.onSettleAndWithdrawCfd(props.data.id, e)} type="submit" className="pure-button" disabled={disableSettle}>
              Settle
            </button>
            <button onClick={e => this.onRefundCfd(props.data.id, e)} type="submit" className="pure-button" disabled={disableRefund}>
              Refund
            </button>
          </td>
        </tr>
      );
    };

    return (
      <div>
        <div className="pure-g">
          <div className="pure-u-1">
            <h2>
              Contract general properties
            </h2>
            <table className="pure-table pure-table-bordered">
              <thead>
                <tr>
                  <th>
                    Property
                  </th>
                  <th>
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    Web3 Selected Wallet
                  </td>
                  <td>
                    {this.state.accounts}
                  </td>
                </tr>
                <tr>
                  <td>
                    Contract Owner
                  </td>
                  <td>
                    {this.state.oracleOwner}
                  </td>
                </tr>
                <tr>
                  <td>
                    Current Block
                  </td>
                  <td>
                    {this.state.currentBlockNumber}
                  </td>
                </tr>
                <tr>
                  <td>
                    Number Of Contracts
                  </td>
                  <td>
                    {this.state.numberOfContracts}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pure-u-1">
            <h2>
              Make Contract
            </h2>
            <CfdMakeForm />
          </div>

          <div className="pure-u-1">
            <h2>
              Contract list
            </h2>
            <table className="pure-table pure-table-bordered">
              <thead>
                <tr>
                  <th>
                    ID
                  </th>
                  <th>
                    Asset
                  </th>
                  <th>
                    Maker
                  </th>
                  <th>
                    Taker
                  </th>
                  <th>
                    Deposit
                  </th>
                  <th>
                    Start Block
                  </th>
                  <th>
                    End Block
                  </th>
                  <th>
                    Status
                  </th>
                  <th>
                    Options
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* '.slice(0)' is used to create a shallow copy, so '.reverse()' does not change the original data
                *  'key' value is just to stop the React warning of missing unique key
                */ }
                {this.state.contracts.slice(0).reverse().map(contract => <ContractRow data={contract} key={contract.id} />)}
              </tbody>
            </table>
          </div>
        </div>

        <div className="buttom-bar">
          <div>
            Status:
            {this.state.message}
          </div>
        </div>
      </div>
    );
  }
}

export default CfdDashboard;
