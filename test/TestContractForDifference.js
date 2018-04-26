const TestUtils = require('./utils.js');
const ContractForDifference = artifacts.require("./ContractForDifference.sol");

contract('ContractForDifference', (accounts) => {
    let cfdInstance = null;
    
    const makerPaymentAddress = accounts[0];
    const makerAddress = "0x3000000000000000000000000000000000000000";
    const makerPosition = 1; // long = 0, short = 1
    const paymentAmount = 1000; // Wei
    let contractStartBlock;
    const contractEndBlock = 5500;

    const cfdId = 0;
    const takerAddress = "0x7000000000000000000000000000000000000000";
    const takerPaymentAddress = accounts[1];
    const takerPosition = 0;
    
    it("...should make a CFD and save it.", async () => {
        cfdInstance = await ContractForDifference.deployed()
        
        const makeCfdResp = await cfdInstance.makeCfd(
            makerAddress,
            makerPosition,
            contractEndBlock,
               { from: makerPaymentAddress, value: paymentAmount }
        );

        const returnedCfd = await cfdInstance.getCfd.call(0);

        // Validate event log
        assert.equal(makeCfdResp.logs[0].event, 'LogMakeCfd', "Could not find expected event log"); // TODO: test the log fields
        
        // Validate contract data
        assert.equal(returnedCfd[0], makerAddress, "returned makerAddress does not match passed value.");
        assert.equal(returnedCfd[1].toNumber(), makerPosition, "returned makerPosition does not match passed value.");
        assert.equal(returnedCfd[2], 0, "returned takerAddress is not 0.");
        assert.equal(returnedCfd[3].toNumber(), 0, "returned takerposition is not 0.");
        assert.equal(returnedCfd[4].toNumber(), paymentAmount, "returned paymentAmount does not match passed value.");
        assert.equal(returnedCfd[5].toNumber(), 0, "returned contractStartTime is not 0.");
        assert.equal(returnedCfd[6].toNumber(), contractEndBlock, "returned contractEndTime does not match passed value.");
    });

    it("...should take a CFD and update its values.", async () => {        
        const takeCfdResp = await cfdInstance.takeCfd(
            cfdId,
            takerAddress,
               { from: makerPaymentAddress, value: paymentAmount }
        );

        contractStartBlock = takeCfdResp.receipt.blockNumber; // Save the contract start block number for later test.
        
        const cfd = await cfdInstance.getCfd(0);

        // Validate event log
        assert.equal(takeCfdResp.logs[0].event, 'LogTakeCfd', "Could not find expected event log"); // TODO: test the log fields
        
        // Validate contract data
        assert.equal(cfd[0], makerAddress, "returned unexpected makerAddress.");
        assert.equal(cfd[1].toNumber(), makerPosition, "returned unexpected makerPosition.");
        assert.equal(cfd[2], takerAddress, "returned unexpected takerAddress.");
        assert.equal(cfd[3].toNumber(), takerPosition, "returned unexpected takerposition.");
        assert.equal(cfd[4].toNumber(), paymentAmount, "returned unexpected paymentAmount.");
        assert.equal(cfd[5].toNumber(), takeCfdResp.receipt.blockNumber, "returned contractStartBlock is not the current block.");
        assert.equal(cfd[6].toNumber(), contractEndBlock, "returned unexpected contractEndTime.");
    });

    /**
     * Testing price recording functionality
     */
    const startPrice = 10;
    const endPrice = 11;
    it("...should record prices.", async () => {
        const recordStartPriceResp = await cfdInstance.recordAssetPrice(
            contractStartBlock,
            startPrice
        );

        const recordEndPriceResp = await cfdInstance.recordAssetPrice(
            contractEndBlock,
            endPrice
        );

        const getStartPriceResp = await cfdInstance.getAssetPrice.call(contractStartBlock);
        const getEndPriceResp = await cfdInstance.getAssetPrice.call(contractEndBlock);

        // Validate event log
        assert.equal(recordStartPriceResp.logs[0].event, 'AssetPriceRecorded', "Unexpected event log for recordStartPrice"); // TODO: test the log fields
        assert.equal(recordEndPriceResp.logs[0].event, 'AssetPriceRecorded', "Unexpected event log for recordEndPrice"); // TODO: test the log fields
        
        // Validate returned price
        assert.equal(getStartPriceResp.toNumber(), startPrice, "returned price does not match passed value.");
        assert.equal(getEndPriceResp.toNumber(), endPrice, "returned price does not match passed value.");
    });

    it("...should settle correctly.", async () => {
        const settleResp = await cfdInstance.settleCfd(0);
        console.log(JSON.stringify(settleResp.logs[0]));
    });
});