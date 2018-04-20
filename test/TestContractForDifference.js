var ContractForDifference = artifacts.require("./ContractForDifference.sol");

contract('ContractForDifference', function (accounts) {

    it("...should register a CFD and return its values.", function () {
        var makerAddress = "0x00000000000000000000000000000000000000a0";
        var makerPosition = 1; // long = 0, short = 1
        var contractEndTime = 1524213232246; // Unix time
        var paymentAddress = accounts[0];
        var paymentAmount = 1234; // Wei

        return ContractForDifference.deployed().then(function (instance) {
            contractForDifferenceInstance = instance;
            return contractForDifferenceInstance.makeCFD(
                makerAddress,
                makerPosition,
                contractEndTime,
                { from: paymentAddress, value: paymentAmount }
            );
        }).then(function () {
            return contractForDifferenceInstance.getCFD(0);
        }).then(function (CFD) {
            assert.equal(CFD[0], makerAddress, "returned makerAddress does not match created value.");
            assert.equal(CFD[1], makerPosition, "returned makerPosition does not match created value.");
            assert.equal(CFD[2], 0, "returned takerAddress is not 0.");
            assert.equal(CFD[3], 0, "returned takerposition is not 0.");
            assert.equal(CFD[4], paymentAmount, "returned paymentAmount does not match created value.");
            assert.equal(CFD[5], 0, "returned contractStartTime is not 0.");
            return assert.equal(CFD[6], contractEndTime, "returned contractEndTime does not match created value.");
        });
    });
});