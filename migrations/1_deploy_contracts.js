var AssetPriceOracle = artifacts.require("./AssetPriceOracle.sol");
var ContractForDifference = artifacts.require("./ContractForDifference.sol");

module.exports = function (deployer, network) {
  deployer.then(async () => { // deployer is currently not directly async/await compatible. See https://github.com/trufflesuite/truffle/issues/501
    if (network == "mainnet") {
      //await deployer.deploy(AssetPriceOracle, { overwrite: false });
      await deployer.deploy(ContractForDifference, "0x4b7a34f1ef5c78226e9ca017595426188daac7ce");
    }
    else if (network == "ropsten") {
      await deployer.deploy(AssetPriceOracle, { overwrite: true });
      await deployer.deploy(ContractForDifference, AssetPriceOracle.address);
    }
    else {
      await deployer.deploy(AssetPriceOracle);
      await deployer.deploy(ContractForDifference, AssetPriceOracle.address);
    }
  })
}
