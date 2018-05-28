const ContractForDifference = artifacts.require("./ContractForDifference.sol");
const AssetPriceOracle = artifacts.require("./AssetPriceOracle.sol");
const { wait, waitUntilBlock } = require("./utils/BlockUtils.js")(web3);

const Web3 = require('web3');

contract('ContractForDifference', async (accounts) => {
  const web3Latest = new Web3(web3.currentProvider);
  const startBlock = 10 //await web3Latest.eth.getBlockNumber();
  let cfdInstance;
  let oracleInstance;

  const makerPaymentAddress = accounts[0];
  const assetId = 1;
  const makerPosition = 1; // long = 0, short = 1
  const paymentAmount = 1000000000000000000; // Amount in Wei
  let contractStartBlock;
  let contractEndBlock; // For some reason I can't use await here without the test runner dropping the whole suite, so I'll set this value in the first test function.

  const cfdId = 0;
  const takerPaymentAddress = accounts[1];
  const takerPosition = 0;

  const startPrice = 100;
  const endPrice = 120;

  const expectedMakerPayout = 800000000000000000;
  const expectedTakerPayout = 1200000000000000000;

  it("...should make a CFD and save it.", async () => {
    cfdInstance = await ContractForDifference.deployed()
    contractEndBlock = 10 + await web3Latest.eth.getBlockNumber();

    const makeCfdResp = await cfdInstance.makeCfd(
      makerPaymentAddress,
      assetId,
      makerPosition,
      contractEndBlock,
      { from: makerPaymentAddress, value: paymentAmount }
    );

    const cfd = await cfdInstance.getCfd.call(0); // 0 = ID of the first contract

    // Validate event log
    assert.equal(makeCfdResp.logs[0].event, 'LogMakeCfd', "Could not find expected event log"); // TODO: test the log fields

    // Validate contract data
    assert.equal(cfd[0], makerPaymentAddress, "returned makerAddress does not match passed value.");
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
    const takeCfdResp = await cfdInstance.takeCfd(
      cfdId,
      takerPaymentAddress,
      { from: takerPaymentAddress, value: paymentAmount }
    );

    contractStartBlock = takeCfdResp.receipt.blockNumber; // Save the contract start block number for later test.

    const cfd = await cfdInstance.getCfd(0);

    // Validate event log
    assert.equal(takeCfdResp.logs[0].event, 'LogTakeCfd', "Could not find expected event log"); // TODO: test the log fields

    // Validate contract data
    assert.equal(cfd[0], makerPaymentAddress, "returned unexpected makerAddress.");
    assert.equal(cfd[1].toNumber(), makerPosition, "returned unexpected makerPosition.");
    assert.equal(cfd[2], takerPaymentAddress, "returned unexpected takerAddress.");
    assert.equal(cfd[3].toNumber(), takerPosition, "returned unexpected takerposition.");
    assert.equal(cfd[4].toNumber(), assetId, "returned assetId is not correct.");
    assert.equal(cfd[5].toNumber(), paymentAmount, "returned unexpected paymentAmount.");
    assert.equal(cfd[6].toNumber(), takeCfdResp.receipt.blockNumber, "returned contractStartBlock is not the current block.");
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
      {from: accounts[0]}
    );
    await oracleInstance.recordAssetPrice(
      assetId,
      contractEndBlock,
      endPrice,
      {from: accounts[0]}
    );

    // Then settle and verify correct outcome
    await waitUntilBlock(15, contractEndBlock);

    const settleResp = await cfdInstance.settleCfd(0);

    assert.equal(settleResp.logs[0].args.makerSettlement, expectedMakerPayout);
    assert.equal(settleResp.logs[0].args.takerSettlement, expectedTakerPayout);
  });
});