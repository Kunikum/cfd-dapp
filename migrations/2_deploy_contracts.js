var AssetPriceOracle = artifacts.require("./AssetPriceOracle.sol");
var ContractForDifference = artifacts.require("./ContractForDifference.sol");
var EIP20Interface = artifacts.require("./EIP20Interface.sol");

module.exports = function(deployer) {
  deployer.deploy(AssetPriceOracle).then(() => {
    console.log('AssetPriceOracle deployed address: ' + AssetPriceOracle.address);
  });
  deployer.deploy(ContractForDifference).then(() => {
    console.log('ContractForDifference deployed address: ' + ContractForDifference.address);
  });
  //deployer.deploy(EIP20Interface);
};
