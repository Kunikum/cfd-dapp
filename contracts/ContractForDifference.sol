pragma solidity ^0.4.23;

import "./AssetPriceOracle.sol";

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
        uint256 contractEndBlock; // in Unix time

        // CFD state variables
        bool isTaken;
        bool isSettled;
    }

    int256 public leverage = 5;
    AssetPriceOracle public priceOracle;

    mapping(uint256 => Cfd) public contracts;
    uint256                 public numberOfContracts;

    event LogMakeCfd (
    uint256 indexed CfdId, 
    address indexed makerAddress, 
    Position indexed makerPosition,
    uint256 amount,
    uint256 contractEndBlock);

    event LogTakeCfd (
    uint256 indexed CfdId, 
    address indexed makerAddress, 
    Position makerPosition, 
    address indexed takerAddress, 
    Position takerPosition,
    uint256 amount,
    uint256 contractStartBlock,
    uint256 contractEndBlock);

    event LogCfdSettled (
    uint256 indexed CfdId, 
    address indexed makerAddress, 
    Position makerPosition, 
    address indexed takerAddress, 
    Position takerPosition,
    uint256 amount,
    uint256 contractStartBlock,
    uint256 contractEndBlock,
    uint256 startPrice,
    uint256 endPrice,
    uint256 makerSettlement,
    uint256 takerSettlement);

    event Debug (
        string description,
        uint256 uintValue,
        int256 intValue
    );

    constructor(address priceOracleAddress) public {
        priceOracle = AssetPriceOracle(priceOracleAddress);
    }

    function makeCfd(
        address  makerAddress,
        Position makerPosition,
        uint256  contractEndBlock
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
        contracts[contractId].contractEndBlock = contractEndBlock;
        numberOfContracts++;
        
        emit LogMakeCfd(
            contractId,
            contracts[contractId].maker.addr,
            contracts[contractId].maker.position,
            contracts[contractId].amount,
            contracts[contractId].contractEndBlock
        );

        return contractId;
    }

    function getCfd(
        uint256 CfdId
        ) 
        public 
        view 
        returns (address makerAddress, Position makerPosition, address takerAddress, Position takerPosition, uint256 amount, uint256 startTime, uint256 endTime, bool isTaken, bool isSettled)
        {
        Cfd storage cfd = contracts[CfdId];
        return (
            cfd.maker.addr,
            cfd.maker.position,
            cfd.taker.addr,
            cfd.taker.position,
            cfd.amount,
            cfd.contractStartBlock,
            cfd.contractEndBlock,
            cfd.isTaken,
            cfd.isSettled
        );
    }

    function takeCfd(
        uint256 CfdId, address takerAddress
        ) 
        public
        payable
        returns (bool success) {
        Cfd storage cfd = contracts[CfdId];
        
        require(cfd.isTaken != true);                  // Contract must not be taken.
        require(cfd.isSettled != true);                // Contract must not be settled.
        require(cfd.maker.addr != address(0));         // Contract must have a maker,
        require(cfd.taker.addr == address(0));         // and no taker.
        require(takerAddress != cfd.maker.addr);       // Maker and Taker must not be the same address.
        require(msg.value == cfd.amount);              // Takers deposit must match makers deposit.
        require(takerAddress != address(0));           // Taker must provide a non-zero address.
        require(block.number <= cfd.contractEndBlock); // Taker must take contract before end block.

        cfd.taker.addr = takerAddress;
        // Make taker position the inverse of maker position
        cfd.taker.position = cfd.maker.position == Position.Long ? Position.Short : Position.Long;
        cfd.contractStartBlock = block.number;
        cfd.isTaken = true;

        emit LogTakeCfd(
            CfdId,
            cfd.maker.addr,
            cfd.maker.position,
            cfd.taker.addr,
            cfd.taker.position,
            cfd.amount,
            cfd.contractStartBlock,
            cfd.contractEndBlock
        );
            
        return true;
    }

    function settleCfd(
        uint256 CfdId
        )
        public
        returns (bool success) {
        Cfd storage cfd = contracts[CfdId];

        require(cfd.contractEndBlock <= block.number); // Contract must have met its end time.
        require(!cfd.isSettled);                       // Contract must not be settled already.
        require(cfd.isTaken);                          // Contract must be taken.
        require(cfd.maker.addr != address(0));         // Contract must have a maker address.
        require(cfd.taker.addr != address(0));         // Contract must have a taker address.


        // Payout settlements to maker and taker
        uint256 makerSettlement = getSettlementAmount(CfdId, cfd.maker.position);
        if (makerSettlement > 0) { 
            cfd.maker.addr.transfer(makerSettlement); 
        }
        uint256 takerSettlement = getSettlementAmount(CfdId, cfd.taker.position);
        if (takerSettlement > 0) {
            cfd.taker.addr.transfer(takerSettlement);
        }

        // Mark contract as settled.
        cfd.isSettled = true;

        emit LogCfdSettled (
            CfdId, 
            cfd.maker.addr, 
            cfd.maker.position, 
            cfd.taker.addr, 
            cfd.taker.position, 
            cfd.amount,
            cfd.contractStartBlock,
            cfd.contractEndBlock,
            priceOracle.getAssetPrice(cfd.contractStartBlock), // startPrice
            priceOracle.getAssetPrice(cfd.contractEndBlock), // endPrice
            makerSettlement,
            takerSettlement
        );

        return true;
    }

    function getSettlementAmount(
        uint256 CfdId,
        Position position
    )
    public
    view
    returns (uint256) {
        require(position == Position.Long || position == Position.Short);

        Cfd storage cfd = contracts[CfdId];
        int256 entryPrice = int256(priceOracle.getAssetPrice(cfd.contractStartBlock));
        int256 exitPrice = int256(priceOracle.getAssetPrice(cfd.contractEndBlock));
        
        if (entryPrice == exitPrice) {return cfd.amount;} // If price didn't change, settle for equal amount to long and short.

        int256 amount = int256(cfd.amount);

        // Price diff calc depends on which position we are calculating settlement for.
        int256 priceDiff = position == Position.Long ? (exitPrice - entryPrice) : (entryPrice - exitPrice);
        int256 settlement = amount + priceDiff * amount * leverage / entryPrice;
        if (settlement < 0) {
            return 0; // Calculated settlement was negative, but a party can't be charged more than his deposit.
        } else if (settlement > amount * 2) {
            return cfd.amount * 2; // Calculated settlement was more than the total deposits, so settle for the total deposits.
        } else {
            return uint256(settlement); // Settlement was more than zero and less than sum of deposit amounts, so we can pay it out as is.
        }
    }
}