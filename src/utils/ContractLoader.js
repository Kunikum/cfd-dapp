import ContractForDifference from '../../build/contracts/ContractForDifference.json';
import AssetPriceOracle from '../../build/contracts/AssetPriceOracle.json';
import ERC20Test from '../../build/contracts/ERC20Test.json';
import DaiStablecoin from '../../abi/DaiStablecoin.json';

import contract from 'truffle-contract';
import web3 from './web3';

// Loads the truffle-contract instance of the ContractForDifference contract.
export const getCfdInstance = async () => {
  const cfd = contract(ContractForDifference);
  cfd.setProvider(web3.currentProvider);
  const cfdInstance = await cfd.deployed();
  return cfdInstance;
}

// Loads the truffle-contract instance of the AssetPriceOracle contract.
export const getApoInstance = async () => {
  const apo = contract(AssetPriceOracle);
  apo.setProvider(web3.currentProvider);
  const apoInstance = await apo.deployed();
  return apoInstance;
}

// Loads the truffle-contract instance of the ERC20Test contract.
export const getERC20TestInstance = async () => {
  const erc20Test = contract(ERC20Test);
  erc20Test.setProvider(web3.currentProvider);
  const erc20TestInstance = await erc20Test.deployed();
  console.log('erc20TestInstance', erc20TestInstance);
  return erc20TestInstance;
}

// Loads the truffle-contract instance of the DaiStablecoin contract.
export const getDaiStablecoinInstance = async () => {
  const daiStablecoinAddress = '0x507def2ae23e90e1d6d3654cf3adc50894a7f2b9';
  
  const daiStablecoin = contract(DaiStablecoin);
  daiStablecoin.setProvider(web3.currentProvider);
  const daiStablecoinInstance = await daiStablecoin.at(daiStablecoinAddress );
  console.log('daiStablecoinInstance', daiStablecoinInstance);
  return daiStablecoinInstance;
}