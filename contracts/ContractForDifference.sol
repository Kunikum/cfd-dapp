pragma solidity 0.4.24;

import "./ds-auth/auth.sol"; // @see https://dappsys.readthedocs.io/en/latest/ds_auth.html
import "./AssetPriceOracle.sol";
import "./lib/SafeMath.sol";

contract ContractForDifference is DSAuth {
    using SafeMath for int256;

    enum Position { Long, Short }
    
    /**
     * A party to the contract. Either the maker or the taker.
     */
    struct Party {
        address addr;
        uint128 withdrawBalance; // Amount the Party can withdraw, as a result of settled contract.
        Position position;
        bool isPaid;
    }
    
    struct Cfd {
        Party maker;
        Party taker;

        uint128 assetId;
        uint128 amount; // in Wei.
        uint128 contractStartBlock; // Block number
        uint128 contractEndBlock; // Block number

        // CFD state variables
        bool isTaken;
        bool isSettled;
        bool isRefunded;
    }

    uint128 public leverage = 1; // Global leverage of the CFD contract.
    AssetPriceOracle public priceOracle;

    mapping(uint128 => Cfd) public contracts;
    uint128                 public numberOfContracts;

    event LogMakeCfd (
    uint128 indexed cfdId, 
    address indexed makerAddress, 
    Position indexed makerPosition,
    uint128 assetId,
    uint128 amount,
    uint128 contractEndBlock);

    event LogTakeCfd (
    uint128 indexed cfdId,
    address indexed makerAddress,
    Position makerPosition,
    address indexed takerAddress,
    Position takerPosition,
    uint128 assetId,
    uint128 amount,
    uint128 contractStartBlock,
    uint128 contractEndBlock);

    event LogCfdSettled (
    uint128 indexed cfdId,
    address indexed makerAddress,
    address indexed takerAddress,
    uint128 amount,
    uint128 startPrice,
    uint128 endPrice,
    uint128 makerSettlement,
    uint128 takerSettlement);

    event LogCfdRefunded (
    uint128 indexed cfdId,
    address indexed makerAddress,
    uint128 amount);

    event LogCfdForceRefunded (
    uint128 indexed cfdId,
    address indexed makerAddress,
    uint128 makerAmount,
    address indexed takerAddress,
    uint128 takerAmount);

    event LogWithdrawal (
    uint128 indexed cfdId,
    address indexed withdrawalAddress,
    uint128 amount);

    // event Debug (
    //     string description,
    //     uint128 uintValue,
    //     int128 intValue
    // );

    constructor(address priceOracleAddress) public {
        priceOracle = AssetPriceOracle(priceOracleAddress);
    }

    function makeCfd(
        address makerAddress,
        uint128 assetId,
        Position makerPosition,
        uint128 contractEndBlock
        )
        public
        payable
        returns (uint128)
    {
        require(contractEndBlock > block.number); // Contract end block must be after current block.
        require(msg.value > 0); // Contract Wei amount must be more than zero - contracts for zero Wei does not make sense.
        require(makerAddress != address(0)); // Maker must provide a non-zero address.
        
        uint128 contractId = numberOfContracts;

        /**
         * Initialize CFD struct using tight variable packing pattern.
         * See https://fravoll.github.io/solidity-patterns/tight_variable_packing.html
         */
        Party memory maker = Party(makerAddress, 0, makerPosition, false);
        Party memory taker = Party(address(0), 0, Position.Long, false);
        Cfd memory newCfd = Cfd(
            maker,
            taker,
            assetId,
            uint128(msg.value),
            0,
            contractEndBlock,
            false,
            false,
            false
        );

        contracts[contractId] = newCfd;

        // contracts[contractId].maker.addr = makerAddress;
        // contracts[contractId].maker.position = makerPosition;
        // contracts[contractId].assetId = assetId;
        // contracts[contractId].amount = uint128(msg.value);
        // contracts[contractId].contractEndBlock = contractEndBlock;

        numberOfContracts++;
        
        emit LogMakeCfd(
            contractId,
            contracts[contractId].maker.addr,
            contracts[contractId].maker.position,
            contracts[contractId].assetId,
            contracts[contractId].amount,
            contracts[contractId].contractEndBlock
        );

        return contractId;
    }

    function getCfd(
        uint128 cfdId
        ) 
        public 
        view 
        returns (address makerAddress, Position makerPosition, address takerAddress, Position takerPosition, uint128 assetId, uint128 amount, uint128 startTime, uint128 endTime, bool isTaken, bool isSettled, bool isRefunded)
        {
        Cfd storage cfd = contracts[cfdId];
        return (
            cfd.maker.addr,
            cfd.maker.position,
            cfd.taker.addr,
            cfd.taker.position,
            cfd.assetId,
            cfd.amount,
            cfd.contractStartBlock,
            cfd.contractEndBlock,
            cfd.isTaken,
            cfd.isSettled,
            cfd.isRefunded
        );
    }

    function takeCfd(
        uint128 cfdId, 
        address takerAddress
        ) 
        public
        payable
        returns (bool success) {
        Cfd storage cfd = contracts[cfdId];
        
        require(cfd.isTaken != true);                  // Contract must not be taken.
        require(cfd.isSettled != true);                // Contract must not be settled.
        require(cfd.isRefunded != true);               // Contract must not be refunded.
        require(cfd.maker.addr != address(0));         // Contract must have a maker,
        require(cfd.taker.addr == address(0));         // and no taker.
        // require(takerAddress != cfd.maker.addr);       // Maker and Taker must not be the same address. (disabled for now)
        require(msg.value == cfd.amount);              // Takers deposit must match makers deposit.
        require(takerAddress != address(0));           // Taker must provide a non-zero address.
        require(block.number <= cfd.contractEndBlock); // Taker must take contract before end block.

        cfd.taker.addr = takerAddress;
        // Make taker position the inverse of maker position
        cfd.taker.position = cfd.maker.position == Position.Long ? Position.Short : Position.Long;
        cfd.contractStartBlock = uint128(block.number);
        cfd.isTaken = true;

        emit LogTakeCfd(
            cfdId,
            cfd.maker.addr,
            cfd.maker.position,
            cfd.taker.addr,
            cfd.taker.position,
            cfd.assetId,
            cfd.amount,
            cfd.contractStartBlock,
            cfd.contractEndBlock
        );
            
        return true;
    }

    function settleAndWithdrawCfd(
        uint128 cfdId
        )
        public {
        Party storage maker = contracts[cfdId].maker;
        Party storage taker = contracts[cfdId].taker;

        settleCfd(cfdId);

        if (maker.withdrawBalance > 0) {
            withdraw(cfdId, maker.addr);
        }
        if (taker.withdrawBalance > 0) {
            withdraw(cfdId, taker.addr);
        }
    }

    function settleCfd(
        uint128 cfdId
        )
        public
        returns (bool success) {
        Cfd storage cfd = contracts[cfdId];

        require(cfd.contractEndBlock <= block.number); // Contract must have met its end time.
        require(!cfd.isSettled);                       // Contract must not be settled already.
        require(!cfd.isRefunded);                      // Contract must not be refunded.
        require(cfd.isTaken);                          // Contract must be taken.
        require(cfd.maker.addr != address(0));         // Contract must have a maker address.
        require(cfd.taker.addr != address(0));         // Contract must have a taker address.

        // Get relevant variables
        uint128 amount = cfd.amount;
        uint128 startPrice = priceOracle.getAssetPrice(cfd.assetId, cfd.contractStartBlock);
        uint128 endPrice = priceOracle.getAssetPrice(cfd.assetId, cfd.contractEndBlock);

        /**
         * Register settlements for maker and taker.
         * Maker recieves any leftover wei from integer division.
         */
        uint128 takerSettlement = getSettlementAmount(amount, startPrice, endPrice, cfd.taker.position);
        if (takerSettlement > 0) {
            cfd.taker.withdrawBalance = takerSettlement;
        }

        uint128 makerSettlement = (amount * 2) - takerSettlement;
        cfd.maker.withdrawBalance = makerSettlement;

        // Mark contract as settled.
        cfd.isSettled = true;

        emit LogCfdSettled (
            cfdId,
            cfd.maker.addr,
            cfd.taker.addr,
            amount,
            startPrice,
            endPrice,
            makerSettlement,
            takerSettlement
        );

        return true;
    }

    function withdraw(
        uint128 cfdId, 
        address partyAddress
    )
    public {
        Cfd storage cfd = contracts[cfdId];
        Party storage party = partyAddress == cfd.maker.addr ? cfd.maker : cfd.taker;
        require(party.withdrawBalance > 0); // The party must have a withdraw balance from previous settlement.
        require(!party.isPaid); // The party must not be already paid out, fx from a refund.

        uint128 amount = party.withdrawBalance;
        party.withdrawBalance = 0;
        party.isPaid = true;
        
        party.addr.transfer(amount);

        emit LogWithdrawal(
            cfdId,
            party.addr,
            amount
        );
    }

    function getSettlementAmount(
        uint128 amountUInt,
        uint128 entryPriceUInt,
        uint128 exitPriceUInt,
        Position position
    )
    public
    view
    returns (uint128) {
        require(position == Position.Long || position == Position.Short);

        // If price didn't change, settle for equal amount to long and short.
        if (entryPriceUInt == exitPriceUInt) {return amountUInt;}

        // If entry price is 0 and exit price is more than 0, all must go to long position and nothing to short.
        if (entryPriceUInt == 0 && exitPriceUInt > 0) {
            return position == Position.Long ? amountUInt * 2 : 0;
        }

        // Cast uint128 to int256 to support negative numbers and increase over- and underflow limits
        int256 entryPrice = int256(entryPriceUInt);
        int256 exitPrice = int256(exitPriceUInt);
        int256 amount = int256(amountUInt);

        // Price diff calc depends on which position we are calculating settlement for.
        int256 priceDiff = position == Position.Long ? exitPrice.sub(entryPrice) : entryPrice.sub(exitPrice);
        int256 settlement = amount.add(priceDiff.mul(amount).mul(leverage).div(entryPrice));
        if (settlement < 0) {
            return 0; // Calculated settlement was negative. But a party can't lose more than his deposit, so he's just awarded 0.
        } else if (settlement > amount * 2) {
            return amountUInt * 2; // Calculated settlement was more than the total deposits, so settle for the total deposits.
        } else {
            return uint128(settlement); // Settlement was more than zero and less than sum of deposit amounts, so we can settle it as is.
        }
    }

    function refundCfd(
        uint128 cfdId
    )
    public
    returns (bool success) {
        Cfd storage cfd = contracts[cfdId];
        require(!cfd.isSettled);                // Contract must not be settled already.
        require(!cfd.isTaken);                  // Contract must not be taken.
        require(!cfd.isRefunded);               // Contract must not be refunded already.
        require(msg.sender == cfd.maker.addr);  // Function caller must be the contract maker.

        cfd.isRefunded = true;
        cfd.maker.isPaid = true;
        cfd.maker.addr.transfer(cfd.amount);

        emit LogCfdRefunded(
            cfdId,
            cfd.maker.addr,
            cfd.amount
        );

        return true;
    }

    function forceRefundCfd(
        uint128 cfdId
    )
    public
    auth
    {
        Cfd storage cfd = contracts[cfdId];
        require(!cfd.isRefunded); // Contract must not be refunded already.

        cfd.isRefunded = true;

        // Refund Taker
        uint128 takerAmount = 0;
        if (cfd.taker.addr != address(0)) {
            takerAmount = cfd.amount;
            cfd.taker.withdrawBalance = 0; // Refunding must reset withdraw balance, if any.
            cfd.taker.addr.transfer(cfd.amount);
        }

        // Refund Maker
        cfd.maker.withdrawBalance = 0; // Refunding must reset withdraw balance, if any.
        cfd.maker.addr.transfer(cfd.amount);
        
        emit LogCfdForceRefunded(
            cfdId,
            cfd.maker.addr,
            cfd.amount,
            cfd.taker.addr,
            takerAmount
        );
    } 

    function () public {
        // dont receive ether via fallback method (by not having 'payable' modifier on this function).
    }
}