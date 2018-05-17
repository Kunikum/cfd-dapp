var ERC20Test = artifacts.require("./ERC20Test.sol");
var AssetPriceOracle = artifacts.require("./AssetPriceOracle.sol");
var ContractForDifference = artifacts.require("./ContractForDifference.sol");
var EIP20Interface = artifacts.require("./EIP20Interface.sol");

module.exports = function (deployer, network) {
  deployer.then(async () => { // deployer is currently not directly async/await compatible. See https://github.com/trufflesuite/truffle/issues/501
    if (network == "ropsten") {
      await deployer.deploy(AssetPriceOracle, { overwrite: true });
      await deployer.deploy(ContractForDifference, AssetPriceOracle.address);
    }
    else {
      await deployer.deploy(ERC20Test);
      await deployer.deploy(AssetPriceOracle);
      await deployer.deploy(ContractForDifference, AssetPriceOracle.address);
    }
  })
}
