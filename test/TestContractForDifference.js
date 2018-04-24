const ContractForDifference = artifacts.require("./ContractForDifference.sol");

contract('ContractForDifference', (accounts) => {
    let cfdInstance = null;
    
    const makerPaymentAddress = accounts[0];
    const makerAddress = "0x3000000000000000000000000000000000000000";
    const makerPosition = 1; // long = 0, short = 1
    const paymentAmount = 1234; // Wei
    const contractEndTime = 1524213232246; // Unix time
    
    const cfdId = 0;
    const takerAddress = "0x7000000000000000000000000000000000000000";
    const takerPaymentAddress = accounts[1];
    const takerPosition = 0;
    
    it("...should make a CFD and save it.", async () => {
        cfdInstance = await ContractForDifference.deployed()
        
        const makeCfdResp = await cfdInstance.makeCfd(
            makerAddress,
            makerPosition,
            contractEndTime,
               { from: makerPaymentAddress, value: paymentAmount }
        );

        const returnedCfd = await cfdInstance.getCfd.call(0);

        // Validate event log
        assert.equal(makeCfdResp.logs[0].event, 'LogMakeCfd', "Could not find expected event log"); // TODO: test the log fields
        
        // Validate contract data
        assert.equal(returnedCfd[0], makerAddress, "returned makerAddress does not match passed value.");
        assert.equal(parseInt(returnedCfd[1]), makerPosition, "returned makerPosition does not match passed value.");
        assert.equal(parseInt(returnedCfd[2]), 0, "returned takerAddress is not 0.");
        assert.equal(parseInt(returnedCfd[3]), 0, "returned takerposition is not 0.");
        assert.equal(parseInt(returnedCfd[4]), paymentAmount, "returned paymentAmount does not match passed value.");
        assert.equal(parseInt(returnedCfd[5]), 0, "returned contractStartTime is not 0.");
        assert.equal(parseInt(returnedCfd[6]), contractEndTime, "returned contractEndTime does not match passed value.");
    });

    it("...should take a CFD and update its values.", async () => {        
        const takeCfdResp = await cfdInstance.takeCfd(
            cfdId,
            takerAddress,
               { from: makerPaymentAddress, value: paymentAmount }
        );
        
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
        assert.equal(cfd[6].toNumber(), contractEndTime, "returned unexpected contractEndTime.");
    });
});