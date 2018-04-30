var AssetPriceOracle = artifacts.require("./AssetPriceOracle.sol");
var ContractForDifference = artifacts.require("./ContractForDifference.sol");
var EIP20Interface = artifacts.require("./EIP20Interface.sol");

module.exports = function(deployer) {
  deployer.deploy(ContractForDifference).then(() => {
    console.log('ContractForDifference deployed address: ' + ContractForDifference.address);
  });
};
