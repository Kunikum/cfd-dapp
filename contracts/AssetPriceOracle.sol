pragma solidity ^0.4.23;

import "./ds-auth/auth.sol"; // https://dappsys.readthedocs.io/en/latest/ds_auth.html

contract AssetPriceOracle is DSAuth {
    // TODO: Consider using uint128 instead of uint256 to save gas.
    // Maximum value expressible with uint128 is 340282366920938463463374607431768211456.
    // If we use 18 decimals for price records (standard Ether precision), 
    // the possible values are still between 0 and 340282366920938463463.374607431768211456.

    struct AssetPriceRecord {
        uint256 price;
        bool isRecord;
    }

    mapping(bytes32 => AssetPriceRecord) public assetPriceRecords;

    event AssetPriceRecorded(
        uint256 indexed assetId,
        uint256 indexed blockNumber,
        uint256 indexed price
    );

    constructor() public {
    }
    
    function recordAssetPrice(uint256 assetId, uint256 blockNumber, uint256 price) public auth {
        bytes32 recordKey = keccak256(assetId, blockNumber);
        assetPriceRecords[recordKey].price = price;
        assetPriceRecords[recordKey].isRecord = true;
        emit AssetPriceRecorded(assetId, blockNumber, price);
    }

    function getAssetPrice(uint256 assetId, uint256 blockNumber) public view returns (uint256 price) {
        AssetPriceRecord storage priceRecord = assetPriceRecords[keccak256(assetId, blockNumber)];
        require(priceRecord.isRecord);
        return priceRecord.price;
    }
}