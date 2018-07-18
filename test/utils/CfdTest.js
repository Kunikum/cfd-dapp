const Web3 = require('web3');
const ContractForDifference = artifacts.require("./ContractForDifference.sol");
const AssetPriceOracle = artifacts.require("./AssetPriceOracle.sol");
import { waitUntilBlock } from './BlockUtils.js';

class CfdTest {
  constructor() {
    this.web3Latest = new Web3(web3.currentProvider);
  }

  async instantiate() {
    this.accounts = await this.web3Latest.eth.getAccounts();
    this.cfdInstance = await ContractForDifference.deployed();
    this.oracleInstance = await AssetPriceOracle.deployed();
  }

  async getMadeCFD({makerAddress = this.accounts[0], assetId = 0, makerPosition = 0, contractDuration = 20, fromAddress = this.accounts[0], depositAmount = '0.01'} = {}) {
    const endBlock = contractDuration + await this.web3Latest.eth.getBlockNumber();
    return await this.cfdInstance.makeCfd(
      makerAddress,
      assetId,
      makerPosition,
      endBlock,
      { from: fromAddress, value: this.web3Latest.utils.toWei(depositAmount, 'ether') },
    );
  }

  async getTakenCFD({makerAddress = this.accounts[0], takerAddress = this.accounts[1], assetId = 0, makerPosition = 0, contractDuration = 20, fromAddress = this.accounts[0], depositAmount = '0.01'} = {}) {
    const madeCfd = await this.getMadeCFD({makerAddress, assetId, makerPosition, contractDuration, fromAddress, depositAmount});
    const cfdId = madeCfd.logs[0].args.cfdId;
    return await this.cfdInstance.takeCfd(
      cfdId,
      takerAddress,
      { from: fromAddress, value: this.web3Latest.utils.toWei(depositAmount, 'ether') },
    );
  }

  async getSettledCFD({makerAddress = this.accounts[0], takerAddress = this.accounts[1], assetId = 0, makerPosition = 0, contractDuration = 20, fromAddress = this.accounts[0], depositAmount = '0.01', assetStartPrice = "100", assetEndPrice = "120"} = {}) {
    const takenCfd = await this.getTakenCFD({makerAddress, takerAddress, assetId, makerPosition, contractDuration, fromAddress, depositAmount});
    const cfdId = takenCfd.logs[0].args.cfdId;
    const cfdStartBlock = takenCfd.logs[0].args.contractStartBlock;
    const cfdEndBlock = takenCfd.logs[0].args.contractEndBlock;
    await this.oracleInstance.recordAssetPrice(
      assetId,
      cfdStartBlock,
      assetStartPrice,
      { from: fromAddress }
    );
    await waitUntilBlock(cfdEndBlock, this.web3Latest);
    await this.oracleInstance.recordAssetPrice(
      assetId,
      cfdEndBlock,
      assetEndPrice,
      { from: fromAddress }
    );
    return await this.cfdInstance.settleAndWithdrawCfd(
      cfdId,
      { from: fromAddress },
    );
  }
}

export default CfdTest;