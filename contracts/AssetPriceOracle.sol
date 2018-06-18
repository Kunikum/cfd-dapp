pragma solidity 0.4.24;

import "./ds-auth/auth.sol"; // @see https://dappsys.readthedocs.io/en/latest/ds_auth.html

contract AssetPriceOracle is DSAuth {
    // Maximum value expressible with uint128 is 340282366920938463463374607431768211456.
    // Using 18 decimals for price records (standard Ether precision), 
    // the possible values are between 0 and 340282366920938463463.374607431768211456.

    struct AssetPriceRecord {
        uint128 price;
        bool isRecord;
    }

    mapping(uint128 => mapping(uint128 => AssetPriceRecord)) public assetPriceRecords;

    event AssetPriceRecorded(
        uint128 indexed assetId,
        uint128 indexed blockNumber,
        uint128 indexed price
    );

    constructor() public {
    }
    
    function recordAssetPrice(uint128 assetId, uint128 blockNumber, uint128 price) public auth {
        assetPriceRecords[assetId][blockNumber].price = price;
        assetPriceRecords[assetId][blockNumber].isRecord = true;
        emit AssetPriceRecorded(assetId, blockNumber, price);
    }

    function getAssetPrice(uint128 assetId, uint128 blockNumber) public view returns (uint128 price) {
        AssetPriceRecord storage priceRecord = assetPriceRecords[assetId][blockNumber];
        require(priceRecord.isRecord);
        return priceRecord.price;
    }

    function () public {
        // dont receive ether via fallback method (by not having 'payable' modifier on this function).
    }
}