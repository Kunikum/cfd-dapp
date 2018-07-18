const ContractForDifference = artifacts.require("./ContractForDifference.sol");
const AssetPriceOracle = artifacts.require("./AssetPriceOracle.sol");
import { waitUntilBlock } from './utils/BlockUtils.js';
import assertRevert from "openzeppelin-solidity/test/helpers/assertRevert.js"; // Requires ES6 module support, see truffle.js
import CfdTest from './utils/CfdTest.js';

const Web3 = require('web3');

contract('ContractForDifference', async (accounts) => {
  const web3Latest = new Web3(web3.currentProvider);
  let cfdInstance;
  let oracleInstance;

  const makerAddress = accounts[0];
  const assetId = 1;
  const makerPosition = 1; // long = 0, short = 1
  const paymentAmount = 1000000000000000000; // Amount in Wei
  let contractStartBlock;
  let contractEndBlock; // For some reason I can't use await here without the test runner dropping the whole suite, so I'll set this value in the first test function.

  let cfdId;
  const takerAddress = accounts[1];
  const takerPosition = 0;

  const startPrice = 100;
  const endPrice = 120;

  const expectedMakerPayout = 800000000000000000;
  const expectedTakerPayout = 1200000000000000000;

  it("...should make a CFD and save it.", async () => {
    cfdInstance = await ContractForDifference.deployed()
    contractEndBlock = 10 + await web3Latest.eth.getBlockNumber();

    // Make CFD
    const makeCfdResult = await cfdInstance.makeCfd(
      makerAddress,
      assetId,
      makerPosition,
      contractEndBlock,
      { from: makerAddress, value: paymentAmount }
    );
    assert.equal(makeCfdResult.logs[0].event, 'LogMakeCfd', "Could not find expected event log");
    cfdId = makeCfdResult.logs[0].args.cfdId;

    const cfd = await cfdInstance.getCfd.call(cfdId);

    // Validate event log
    assert.equal(makeCfdResult.logs[0].event, 'LogMakeCfd', "Could not find expected event log"); // TODO: test the log fields

    // Validate contract data
    assert.equal(cfd[0], makerAddress, "returned makerAddress does not match passed value.");
    assert.equal(cfd[1].toNumber(), makerPosition, "returned makerPosition does not match passed value.");
    assert.equal(cfd[2], 0, "returned takerAddress is not 0.");
    assert.equal(cfd[3].toNumber(), 0, "returned takerposition is not 0.");
    assert.equal(cfd[4].toNumber(), assetId, "returned paymentAmount does not match passed value.");
    assert.equal(cfd[5].toNumber(), paymentAmount, "returned paymentAmount does not match passed value.");
    assert.equal(cfd[6].toNumber(), 0, "returned contractStartTime is not 0.");
    assert.equal(cfd[7].toNumber(), contractEndBlock, "returned contractEndBlock does not match passed value.");
    assert.equal(cfd[8], false, "isTaken should be false.");
    assert.equal(cfd[9], false, "isSettled should be false.");
  });

  it("...should take a CFD and update its values.", async () => {
    const takeCfdResult = await cfdInstance.takeCfd(
      cfdId,
      takerAddress,
      { from: takerAddress, value: paymentAmount }
    );

    contractStartBlock = takeCfdResult.receipt.blockNumber; // Save the contract start block number for registering price data.

    const cfd = await cfdInstance.getCfd(0);

    // Validate event log
    assert.equal(takeCfdResult.logs[0].event, 'LogTakeCfd', "Could not find expected event log"); // TODO: test the log fields

    // Validate contract data
    assert.equal(cfd[0], makerAddress, "returned unexpected makerAddress.");
    assert.equal(cfd[1].toNumber(), makerPosition, "returned unexpected makerPosition.");
    assert.equal(cfd[2], takerAddress, "returned unexpected takerAddress.");
    assert.equal(cfd[3].toNumber(), takerPosition, "returned unexpected takerposition.");
    assert.equal(cfd[4].toNumber(), assetId, "returned assetId is not correct.");
    assert.equal(cfd[5].toNumber(), paymentAmount, "returned unexpected paymentAmount.");
    assert.equal(cfd[6].toNumber(), takeCfdResult.receipt.blockNumber, "returned contractStartBlock is not the current block.");
    assert.equal(cfd[7].toNumber(), contractEndBlock, "returned unexpected contractEndBlock.");
    assert.equal(cfd[8], true, "isTaken should be true.");
    assert.equal(cfd[9], false, "isSettled should be false.");
  });

  it("...should settle correctly.", async () => {
    // First register price data
    oracleInstance = await AssetPriceOracle.deployed();
    await oracleInstance.recordAssetPrice(
      assetId,
      contractStartBlock,
      startPrice,
      { from: accounts[0] }
    );
    await oracleInstance.recordAssetPrice(
      assetId,
      contractEndBlock,
      endPrice,
      { from: accounts[0] }
    );

    // Wait until end of contract
    await waitUntilBlock(contractEndBlock, web3Latest);

    // Settle and withdraw maker and takers payouts
    const settleAndWithdrawResult = await cfdInstance.settleAndWithdrawCfd(0);

    // Verify correct settlement
    assert.equal(settleAndWithdrawResult.logs[0].args.cfdId, '0');
    assert.equal(settleAndWithdrawResult.logs[0].args.makerAddress, makerAddress);
    assert.equal(settleAndWithdrawResult.logs[0].args.makerSettlement, expectedMakerPayout);
    assert.equal(settleAndWithdrawResult.logs[0].args.takerAddress, takerAddress);
    assert.equal(settleAndWithdrawResult.logs[0].args.takerSettlement, expectedTakerPayout);

    // Verify correct maker withdrawal
    assert.equal(settleAndWithdrawResult.logs[1].args.cfdId, '0');
    assert.equal(settleAndWithdrawResult.logs[1].args.withdrawalAddress, makerAddress);
    assert.equal(settleAndWithdrawResult.logs[1].args.amount, expectedMakerPayout);

    // Verify correct taker withdrawal
    assert.equal(settleAndWithdrawResult.logs[2].args.cfdId, '0');
    assert.equal(settleAndWithdrawResult.logs[2].args.withdrawalAddress, takerAddress);
    assert.equal(settleAndWithdrawResult.logs[2].args.amount, expectedTakerPayout);
  });

  it("...should accept taking CFD when makerAddress = takerAddress.", async () => {
    cfdInstance = await ContractForDifference.deployed()
    contractEndBlock = 10 + await web3Latest.eth.getBlockNumber();

    // Make CFD
    const makeCfdResult = await cfdInstance.makeCfd(
      makerAddress,
      assetId,
      makerPosition,
      contractEndBlock,
      { from: makerAddress, value: paymentAmount }
    );
    assert.equal(makeCfdResult.logs[0].event, 'LogMakeCfd', "Could not find expected LogMakeCfd event log");
    cfdId = makeCfdResult.logs[0].args.cfdId;

    // Take CFD with same takerAddress as makerAddress
    const takeCfdResult = await cfdInstance.takeCfd(
      cfdId,
      makerAddress,
      { from: makerAddress, value: paymentAmount }
    );

    // Verify that CFD was taken
    assert.equal(takeCfdResult.logs[0].event, 'LogTakeCfd', "Could not find expected LogTakeCfd event log");
  });

  it("...should reject CFD creation when end block is before current block.", async () => {
    cfdInstance = await ContractForDifference.deployed()
    contractEndBlock = await web3Latest.eth.getBlockNumber() - 1; // Invalid end block!

    await assertRevert(
      cfdInstance.makeCfd(
        makerAddress,
        assetId,
        makerPosition,
        contractEndBlock,
        { from: makerAddress, value: paymentAmount }
      )
    );
  });

  it("...should reject sending ether directly to the contract.", async () => {
    cfdInstance = await ContractForDifference.deployed();
    await assertRevert(
      cfdInstance.sendTransaction(
        { from: makerAddress, value: paymentAmount }
      )
    );
  });

  it("...should settle whole deposit to short position, when asset price goes to zero.", async () => {
    let cfdTest = new CfdTest();
    await cfdTest.instantiate();

    const settledCfd = await cfdTest.getSettledCFD({makerPosition: 0, depositAmount: '1', assetEndPrice: '0'});

    assert.equal(settledCfd.logs[0].args.makerSettlement.toString(10), '0');
    assert.equal(settledCfd.logs[0].args.takerSettlement.toString(10), '2000000000000000000');
  });

  it("...should award any remainder of settlement calculation to taker, when taker wins as short.", async () => {
    let cfdTest = new CfdTest();
    await cfdTest.instantiate();

    const settledCfd = await cfdTest.getSettledCFD({makerPosition: 0, depositAmount: '0.111111111111111111', assetStartPrice: '10', assetEndPrice: '3'});
    assert.equal(settledCfd.logs[0].args.makerSettlement.toString(10), '33333333333333334');
    assert.equal(settledCfd.logs[0].args.takerSettlement.toString(10), '188888888888888888');
  });

  it("...should award any remainder of settlement calculation to taker, when taker looses as short.", async () => {
    let cfdTest = new CfdTest();
    await cfdTest.instantiate();

    // When taker looses as short
    const settledCfd2 = await cfdTest.getSettledCFD({makerPosition: 0, depositAmount: '0.111111111111111111', assetStartPrice: '10', assetEndPrice: '13'});
    assert.equal(settledCfd2.logs[0].args.makerSettlement.toString(10), '144444444444444444');
    assert.equal(settledCfd2.logs[0].args.takerSettlement.toString(10), '77777777777777778');
  });

  it("...should award any remainder of settlement calculation to taker, when taker wins as long.", async () => {
    let cfdTest = new CfdTest();
    await cfdTest.instantiate();

    const settledCfd3 = await cfdTest.getSettledCFD({makerPosition: 1, depositAmount: '0.111111111111111111', assetStartPrice: '10', assetEndPrice: '13'});
    assert.equal(settledCfd3.logs[0].args.makerSettlement.toString(10), '77777777777777778');
    assert.equal(settledCfd3.logs[0].args.takerSettlement.toString(10), '144444444444444444');
  });

  it("...should award any remainder of settlement calculation to taker, when taker looses as long.", async () => {
    let cfdTest = new CfdTest();
    await cfdTest.instantiate();

    const settledCfd4 = await cfdTest.getSettledCFD({makerPosition: 1, depositAmount: '0.111111111111111111', assetStartPrice: '10', assetEndPrice: '3'});
    assert.equal(settledCfd4.logs[0].args.makerSettlement.toString(10), '188888888888888888');
    assert.equal(settledCfd4.logs[0].args.takerSettlement.toString(10), '33333333333333334');
  });
});