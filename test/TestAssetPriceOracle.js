const AssetPriceOracle = artifacts.require("./AssetPriceOracle.sol");

contract('AssetPriceOracle', (accounts) => {
    const blockNumber = 23;
    const price = 1234;    
    it("...should record prices.", async () => {
        oracleInstance = await AssetPriceOracle.deployed()
        
        const recordPriceResp = await oracleInstance.recordAssetPrice(
            blockNumber,
            price
        );

        const getPriceResp = await oracleInstance.getAssetPrice.call(blockNumber);

        // Validate event log
        assert.equal(recordPriceResp.logs[0].event, 'AssetPriceRecorded', "Unexpected event log entry 0"); // TODO: test the log fields
        
        // Validate contract data
        assert.equal(getPriceResp.toNumber(), price, "returned price does not match passed value.");
        //assert.equal(getPriceResp[1].toNumber(), price, "returned price does not match passed value.");
    });
});