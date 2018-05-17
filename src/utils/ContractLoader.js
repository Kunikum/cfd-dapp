import ContractForDifference from '../../build/contracts/ContractForDifference.json';
import AssetPriceOracle from '../../build/contracts/AssetPriceOracle.json';
import ERC20Test from '../../build/contracts/ERC20Test.json';

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
    return erc20TestInstance;
}