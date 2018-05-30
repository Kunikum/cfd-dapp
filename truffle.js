require('babel-register')({
  ignore: /node_modules\/(?!openzeppelin-solidity\/test\/helpers)/
})
require('babel-polyfill')

var HDWalletProvider = require("truffle-hdwallet-provider");

var infura_apikey = "UKR0P7qucHTZ96FjnDB1";
var mnemonic = "apple warrior license hard know pilot abandon stadium fly rookie veteran citizen";

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "localhost",
      port: 7545,
      network_id: "*", // Match any network id
      gas: 4500000, // Current Ropsten gas limit. See https://ropsten.etherscan.io/block/3141628
      gasPrice: 5000000000 // 5 GWei (AKA 'Shannon') - a resonable gasprice based on current main chain numbers from ethgasstation.info.
    },
    ropsten: {
      provider: new HDWalletProvider(mnemonic, "https://ropsten.infura.io/"+infura_apikey),
      network_id: 3,
      gas: 4500000, // Current Ropsten gas limit. See https://ropsten.etherscan.io/block/3141628
      gasPrice: 1100000000 // 1.1 GWei - based on the lower end of current txs getting into blocks currently on Ropsten.
    }
  },
  solc: {
    optimizer: { // 
      enabled: false, // Disabled by default! But we want smaller contract size, so we enable it. See release notes here: https://github.com/trufflesuite/truffle/releases/tag/v4.0.0
      runs: 500 // Informs optimizer off how to balance trade-off between contract size (and therefor deploy gas cost) and contract function execution cost.
    }
  }
};