pragma solidity ^0.4.21;

import "./ds-auth/auth.sol"; // https://dappsys.readthedocs.io/en/latest/ds_auth.html

contract AssetPriceOracle is DSAuth {
    mapping(uint256 => uint256) private assetPriceRecords;

    event AssetPriceRecorded(
        uint256 blockNumber,
        uint256 price
    );

    event AssetPriceUpdated(
        uint256 blockNumber,
        uint256 price
    );
    
    function recordAssetPrice(uint256 blockNumber, uint256 price) public auth {
        require(assetPriceRecords[blockNumber] == 0); // Price must not be set already.
        assetPriceRecords[blockNumber] = price;
        emit AssetPriceRecorded(blockNumber, price);
    }

    function updateAssetPrice(uint256 blockNumber, uint256 price) public auth {
        require(assetPriceRecords[blockNumber] != 0); // Price must be set already.
        assetPriceRecords[blockNumber] = price;
        emit AssetPriceUpdated(blockNumber, price);
    }

    function getAssetPrice(uint256 blockNumber) public view returns (uint256 price) {
        return assetPriceRecords[blockNumber];
    }
}