pragma solidity ^0.4.21;

//import "./EIP20Interface.sol";

contract ContractForDifference {

    enum Position { Long, Short }
    
    struct Party {
        address addr;
        Position position;
    }
    
    struct Cfd {
        Party maker;
        Party taker;
        
        uint256 amount; // in Wei.
        uint256 contractStartBlock; // in Unix time
        uint256 contractEndTime; // in Unix time
    }

    mapping(uint256 => Cfd) private contracts;
    uint256                 private numberOfContracts;

    event LogMakeCfd (
    uint256 indexed CfdId, 
    address indexed makerAddress, 
    Position makerPosition,
    uint256 amount,
    uint256 contractEndTime);

    event LogTakeCfd (
    uint256 indexed CfdId, 
    address indexed makerAddress, 
    Position makerPosition, 
    address indexed takerAddress, 
    Position takerPosition,
    uint256 amount,
    uint256 contractStartBlock,
    uint256 contractEndTime);

    function makeCfd(
        address  makerAddress,
        Position makerPosition,
        uint256  contractEndTime
        )
        public
        payable
        returns (uint256)
    {
        require(msg.value > 0); // Contract Wei amount must be more than zero - contracts for zero Wei does not make sense.
        require(makerAddress != address(0)); // Maker must provide a non-zero address.
        
        uint256 contractId = numberOfContracts;

        contracts[contractId].maker = Party(makerAddress, makerPosition);
        contracts[contractId].amount = msg.value;
        contracts[contractId].contractEndTime = contractEndTime;
        numberOfContracts++;
        
        emit LogMakeCfd(
            contractId,
            contracts[contractId].maker.addr,
            contracts[contractId].maker.position,
            contracts[contractId].amount,
            contracts[contractId].contractEndTime);

        return contractId;
    }

    function getCfd(
        uint256 CfdId
        ) 
        public 
        constant 
        returns (address makerAddress, Position makerPosition, address takerAddress, Position takerPosition, uint256 amount, uint256 startTime, uint256 endTime) {
        return (
            contracts[CfdId].maker.addr,
            contracts[CfdId].maker.position,
            contracts[CfdId].taker.addr,
            contracts[CfdId].taker.position,
            contracts[CfdId].amount,
            contracts[CfdId].contractStartBlock,
            contracts[CfdId].contractEndTime
            );
    }

    function takeCfd(
        uint256 CfdId, address takerAddress
        ) 
        public
        payable
        returns (bool success) {
        Cfd storage cfd = contracts[CfdId];
        
        require (cfd.maker.addr != address(0)); // Contract must have a maker,
        require (cfd.taker.addr == address(0)); // and no taker.
        require(msg.value == cfd.amount);       // Takers deposit must match makers deposit.
        require(takerAddress != address(0));    // Taker must provide a non-zero address.

        cfd.taker.addr = takerAddress;
        cfd.taker.position = cfd.maker.position == Position.Long ? Position.Short : Position.Long; // Make taker position the inverse of maker position
        cfd.contractStartBlock = block.number;

        emit LogTakeCfd(
            CfdId,
            cfd.maker.addr,
            cfd.maker.position,
            cfd.taker.addr,
            cfd.taker.position,
            cfd.amount,
            cfd.contractStartBlock,
            cfd.contractEndTime);
            
        return true;
    }
}