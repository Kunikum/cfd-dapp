import ContractForDifference from '../build/contracts/ContractForDifference.json';
import contract from 'truffle-contract';
import web3 from './utils/web3';

const getCfdInstance = async () => {
    const cfd = contract(ContractForDifference);
    cfd.setProvider(web3.currentProvider);
    const cfdInstance = await cfd.deployed();
    return cfdInstance;
}

export default getCfdInstance;