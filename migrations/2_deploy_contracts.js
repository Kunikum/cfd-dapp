var AssetPriceOracle = artifacts.require("./AssetPriceOracle.sol");
var ContractForDifference = artifacts.require("./ContractForDifference.sol");
var EIP20Interface = artifacts.require("./EIP20Interface.sol");

module.exports = function (deployer, network) {
  deployer.then(async () => { // deployer is currently not directly async/await compatible. See https://github.com/trufflesuite/truffle/issues/501
    if (network == "ropsten") {
      await deployer.deploy(AssetPriceOracle, { overwrite: false });
      await deployer.deploy(ContractForDifference, AssetPriceOracle.address);
    }
    else {
      await deployer.deploy(AssetPriceOracle);
      await deployer.deploy(ContractForDifference, AssetPriceOracle.address);
    }
  })
}
