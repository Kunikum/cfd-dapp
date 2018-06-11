import ContractForDifference from '../../build/contracts/ContractForDifference.json';
import AssetPriceOracle from '../../build/contracts/AssetPriceOracle.json';
import contract from 'truffle-contract';
import web3 from './web3';

// Loads the truffle-contract instance of the ContractForDifference 
export async function getCfdInstance() {
    const cfd = contract(ContractForDifference);
    cfd.setProvider(web3.currentProvider);
    const cfdInstance = await cfd.deployed();
    return cfdInstance;
}

// Loads the truffle-contract instance of the AssetPriceOracle
export async function getApoInstance() {
    const apo = contract(AssetPriceOracle);
    apo.setProvider(web3.currentProvider);
    const apoInstance = await apo.deployed();
    return apoInstance;
}