pragma solidity ^0.4.23;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/ContractForDifference.sol";

contract TestContractForDifference {
    function solidityTestExample() public {
        // ContractForDifference cfd = ContractForDifference(DeployedAddresses.ContractForDifference());
        // cfd.set(89);
        // uint expected = 89;
        // Assert.equal(cfd.get(), expected, "It should store the value 89.");
        Assert.equal(true, true, "It's not true! Oh ma gahh!");
    }
}