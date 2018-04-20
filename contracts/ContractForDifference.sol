pragma solidity ^0.4.21;

//import "./EIP20Interface.sol";

contract ContractForDifference {

    enum Position { Long, Short }
    
    struct Party {
        address addr;
        Position position;
    }
    
    struct CFD {
        Party maker;
        Party taker;
        
        uint256 amount;
        uint256 contractStartTime;
        uint256 contractEndTime;
    }

    mapping(uint256 => CFD) private contracts;
    uint256                 private numberOfContracts;

    event LogNewCFD (uint256 indexed CFDId, address makerAddress, Position makerPosition, uint256 endTime);

    function makeCFD (
        address  makerAddress,
        Position makerPosition,
        uint256  contractEndTime
        )
        public
        payable
        returns(uint256 CFDId)
    {
        require(msg.value > 0); // Contract amount must have a value - contracts for zero Ether does not make sense
        contracts[numberOfContracts].maker = Party(makerAddress, makerPosition);
        contracts[numberOfContracts].amount = msg.value;
        contracts[numberOfContracts].contractEndTime = contractEndTime;
        numberOfContracts++;
        
        emit LogNewCFD(
            numberOfContracts-1,
            makerAddress,
            makerPosition,
            contractEndTime);

        return numberOfContracts-1;
    }

    function getCFD(uint256 CDFId) public constant returns (address, Position, address, Position, uint256, uint256, uint256) {
        return (
            contracts[CDFId].maker.addr,
            contracts[CDFId].maker.position,
            contracts[CDFId].taker.addr,
            contracts[CDFId].taker.position,
            contracts[CDFId].amount,
            contracts[CDFId].contractStartTime,
            contracts[CDFId].contractEndTime
            );
    }
}