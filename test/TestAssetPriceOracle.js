const AssetPriceOracle = artifacts.require("./AssetPriceOracle.sol");

contract('AssetPriceOracle', (accounts) => {
  const assetId1 = 1;
  const blockNumber1 = 23;
  const price1 = 1234;

  const assetId2 = 2;
  const blockNumber2 = 12;
  const price2 = 4321;

  let oracleInstance = null;

  it("...should record a price and report it correctly afterwards.", async () => {
    oracleInstance = await AssetPriceOracle.deployed()

    const recordPriceResp = await oracleInstance.recordAssetPrice(
      assetId1,
      blockNumber1,
      price1,
      {from: accounts[0]}
    );

    // Validate event log
    assert.equal(recordPriceResp.logs[0].event, 'AssetPriceRecorded', "Unexpected event log entry 0"); // TODO: test the log fields

    // Validate contract data
    const getPriceResp = await oracleInstance.getAssetPrice.call(assetId1, blockNumber1);
    assert.equal(getPriceResp.toNumber(), price1, "returned price does not match passed value.");
    //assert.equal(getPriceResp[1].toNumber(), price, "returned price does not match passed value.");
  });

  it("...should record a second price and report it correctly afterwards.", async () => {
    const recordPriceResp = await oracleInstance.recordAssetPrice(
      assetId2,
      blockNumber2,
      price2,
      {from: accounts[0]}
    );

    // Validate event log
    assert.equal(recordPriceResp.logs[0].event, 'AssetPriceRecorded', "Unexpected event log entry 0"); // TODO: test the log fields

    // Validate contract data
    const getPriceResp = await oracleInstance.getAssetPrice.call(assetId2, blockNumber2);
    assert.equal(getPriceResp.toNumber(), price2, "returned price does not match recorded.");
  });

  it("...should NOT record a price when sender is not the owner.", async () => {
    try {
      await oracleInstance.recordAssetPrice(
        assetId2,
        blockNumber2,
        price2,
        {from: accounts[1]} // <-- not the owner! :)
      );
    } catch (error) {
      assert.equal(error.message, 'VM Exception while processing transaction: revert');
      return;
    }

    assert.fail('expected error: "VM Exception while processing transaction: revert"'); // The above should throw an error and return, so we should never get down here.
  });
});