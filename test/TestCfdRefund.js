const ContractForDifference = artifacts.require("./ContractForDifference.sol");
const { wait, waitUntilBlock } = require("./utils/BlockUtils.js")(web3);

const Web3 = require('web3'); // web3 1.0

contract('ContractForDifference Refund', async (accounts) => {
  const web3Latest = new Web3(web3.currentProvider); // web3 1.0 instance
  
  /** 
   * convert String or Number to BN.js object. 
   * @see https://github.com/indutny/bn.js/ 
   */
  const toBN = web3Latest.utils.toBN;

  const startBlock = 10 //await web3Latest.eth.getBlockNumber();
  let cfdInstance;
  let oracleInstance;

  const makerAddress = accounts[0];
  const assetId = 1;
  const makerPosition = 1; // long = 0, short = 1
  const paymentAmount = toBN(1000000000000000000); // 1 Ether in Wei
  let contractStartBlock;
  let contractEndBlock; // For some reason I can't use await here without the test runner dropping the whole suite, so I'll set this value in the first test function.

  const cfdId = 0;
  const takerAddress = accounts[1];
  const takerPosition = 0;

  const startPrice = 100;
  const endPrice = 120;

  it("...should allow refund when: taker = none and msg.sender = maker", async () => {
    cfdInstance = await ContractForDifference.deployed();
    const startBalance = toBN(await web3Latest.eth.getBalance(accounts[0]));

    // Make a contract.
    contractEndBlock = 3 + await web3Latest.eth.getBlockNumber();
    const makeCfdResult = await cfdInstance.makeCfd(
      makerAddress,
      assetId,
      makerPosition,
      contractEndBlock,
      { from: makerAddress, value: paymentAmount }
    );
    assert.equal(makeCfdResult.logs[0].event, 'LogMakeCfd', "Could not find expected event log");
    const contractId = makeCfdResult.logs[0].args.cfdId;
    const makeCfdGasCost = await getGasCost(web3Latest, makeCfdResult)

    // Check that maker sent 'paymentAmount' ether
    const beforeRefundBalance = toBN(await web3Latest.eth.getBalance(accounts[0]));
    assert.equal(beforeRefundBalance.toString(), startBalance.sub(paymentAmount).sub(makeCfdGasCost).toString());

    // Wait for contract to end.
    await waitUntilBlock(15, contractEndBlock);

    // Refund contract
    const refundCfdResult = await cfdInstance.refundCfd(
      contractId,
      { from: makerAddress }
    );
    const refundGasCost = await getGasCost(web3Latest, refundCfdResult)

    // Verify that maker got his ether back
    const afterRefundBalance = toBN(await web3Latest.eth.getBalance(accounts[0]));
    assert.equal(afterRefundBalance.toString(), beforeRefundBalance.add(paymentAmount).sub(refundGasCost).toString());

    // Validate event log
    assert.equal(refundCfdResult.logs[0].event, 'LogCfdRefunded', "Could not find expected LogCfdRefunded log");
    assert.equal(refundCfdResult.logs[0].args.cfdId.toString(), contractId.toString(), "Unexpected cfdId in LogCfdRefunded");
    assert.equal(refundCfdResult.logs[0].args.makerAddress.toString(), accounts[0], "Unexpected makerAddress in LogCfdRefunded");
    assert.equal(refundCfdResult.logs[0].args.amount.toString(), paymentAmount.toString(), "Unexpected amount in LogCfdRefunded");

    // Validate contract data
    const cfd = await cfdInstance.getCfd.call(contractId);
    assert.equal(cfd[0], makerAddress, "returned unexpected makerAddress.");
    assert.equal(cfd[5], paymentAmount.toString(), "returned unexpected paymentAmount.");
    assert.equal(cfd[8], false, "isTaken should be false.");
    assert.equal(cfd[9], false, "isSettled should be false.");
    assert.equal(cfd[10], true, "isRefunded should be true.");
  });

//   it("...should take a CFD and update its values.", async () => {
//     const takeCfdResp = await cfdInstance.takeCfd(
//       cfdId,
//       takerAddress,
//       { from: takerAddress, value: paymentAmount }
//     );

//     contractStartBlock = takeCfdResp.receipt.blockNumber; // Save the contract start block number for later test.

//     const cfd = await cfdInstance.getCfd(0);

//     // Validate event log
//     assert.equal(takeCfdResp.logs[0].event, 'LogTakeCfd', "Could not find expected event log"); // TODO: test the log fields

//     // Validate contract data
//     assert.equal(cfd[0], makerAddress, "returned unexpected makerAddress.");
//     assert.equal(cfd[1].toNumber(), makerPosition, "returned unexpected makerPosition.");
//     assert.equal(cfd[2], takerAddress, "returned unexpected takerAddress.");
//     assert.equal(cfd[3].toNumber(), takerPosition, "returned unexpected takerposition.");
//     assert.equal(cfd[4].toNumber(), assetId, "returned assetId is not correct.");
//     assert.equal(cfd[5].toNumber(), paymentAmount, "returned unexpected paymentAmount.");
//     assert.equal(cfd[6].toNumber(), takeCfdResp.receipt.blockNumber, "returned contractStartBlock is not the current block.");
//     assert.equal(cfd[7].toNumber(), contractEndBlock, "returned unexpected contractEndBlock.");
//     assert.equal(cfd[8], true, "isTaken should be true.");
//     assert.equal(cfd[9], false, "isSettled should be false.");
//   });

//   it("...should settle correctly.", async () => {
//     // First register price data
//     oracleInstance = await AssetPriceOracle.deployed();
//     await oracleInstance.recordAssetPrice(
//       assetId,
//       contractStartBlock,
//       startPrice,
//       {from: accounts[0]}
//     );
//     await oracleInstance.recordAssetPrice(
//       assetId,
//       contractEndBlock,
//       endPrice,
//       {from: accounts[0]}
//     );

//     // Then settle and verify correct outcome
//     await waitUntilBlock(15, contractEndBlock);

//     const settleResp = await cfdInstance.settleCfd(0);

//     assert.equal(settleResp.logs[0].args.makerSettlement, expectedMakerPayout);
//     assert.equal(settleResp.logs[0].args.takerSettlement, expectedTakerPayout);
//   });
});

async function getGasCost(web3, contractFunctionResult) {
  const toBN = web3.utils.toBN;
  const contractFunctionTx = await web3.eth.getTransaction(contractFunctionResult.tx);
  return toBN(contractFunctionTx.gasPrice).mul(toBN(contractFunctionResult.receipt.gasUsed));
}