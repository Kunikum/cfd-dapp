/**
 * This file (truffl-config.js) is just a copy of truffle.js for compatibility with Windows.
 */

require('babel-register')({
  ignore: /node_modules\/(?!openzeppelin-solidity\/test\/helpers)/
})
require('babel-polyfill')

var config = require('./truffle.json');

var HDWalletProvider = require("truffle-hdwallet-provider");
var infura_apikey = "UKR0P7qucHTZ96FjnDB1";
var testMnemonic = "apple warrior license hard know pilot abandon stadium fly rookie veteran citizen";


// See <http://truffleframework.com/docs/advanced/configuration>
// to customize your Truffle configuration!
module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 7545, // Ganache JSON-RPC port
      network_id: "*", // Match any network id
      gas: 4500000, // Current Ropsten gas limit. See https://ropsten.etherscan.io/block/3141628
      gasPrice: 5000000000 // 5 GWei (AKA 'Shannon') - a resonable gasprice based on current main chain numbers from ethgasstation.info.
    },
    ropsten: {
      provider: function() { 
        return new HDWalletProvider(testMnemonic, "https://ropsten.infura.io/"+infura_apikey) 
      },
      network_id: 3,
      gas: 4500000, // Current Ropsten gas limit. See https://ropsten.etherscan.io/block/3141628
      gasPrice: 11100000000 // 11.1 GWei - based on the middle price of current txs getting into blocks currently on Ropsten.
    },
    main: {
      provider: function() { 
        return new HDWalletProvider(config.mnemonic, "https://infura.io/"+infura_apikey) 
      },
      network_id: 1,
      gas: 8000000, // Current mainnet gas limit. See https://etherscan.io/block/5955866
      gasPrice: 16100000000 // in wei - based on SafeLow from https://ethgasstation.info/
    }
  },
  solc: {
    // Turns on the Solidity optimizer. For development the optimizer's
    // quite helpful, just remember to be careful, and potentially turn it
    // off, for live deployment and/or audit time. For more information,
    // see the Truffle 4.0.0 release notes.
    //
    // https://github.com/trufflesuite/truffle/releases/tag/v4.0.0
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}