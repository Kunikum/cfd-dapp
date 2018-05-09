pragma solidity ^0.4.23;

import "./ds-auth/auth.sol"; // https://dappsys.readthedocs.io/en/latest/ds_auth.html

contract AssetPriceOracle is DSAuth {
    // TODO: Consider using uint256 instead of uint256 to save gas.
    // Maximum value expressible with uint256 is 340282366920938463463374607431768211456.
    // If we use 18 decimals for price records (standard Ether precision), 
    // the possible values are still between 0 and 340282366920938463463.374607431768211456.
    mapping(uint256 => uint256) public assetPriceRecords;
    uint256[] public blocksWithPrice;

    event AssetPriceRecorded(
        uint256 indexed blockNumber,
        uint256 indexed price
    );

    event AssetPriceUpdated(
        uint256 indexed blockNumber,
        uint256 indexed price
    );

    constructor() public {
        recordAssetPrice(0, 300000000000000000000);  // 300.000000000000000000
        recordAssetPrice(1, 301000000000000000000);  // 301.000000000000000000
        recordAssetPrice(3, 303000000000000000000);  // 303.000000000000000000
        recordAssetPrice(2, 302000000000000000000);  // 302.000000000000000000
        recordAssetPrice(4, 304000000000000000000);  // 304.000000000000000000
        recordAssetPrice(5, 305000000000000000000);  // 305.000000000000000000
        recordAssetPrice(6, 306000000000000000000);  // 306.000000000000000000
        recordAssetPrice(7, 307000000000000000000);  // 307.000000000000000000
        recordAssetPrice(8, 308000000000000000000);  // 308.000000000000000000
        recordAssetPrice(9, 309000000000000000000);  // 309.000000000000000000
        recordAssetPrice(10, 310000000000000000000); // 310.000000000000000000
        recordAssetPrice(11, 309500000000000000000); // 309.500000000000000000
        recordAssetPrice(12, 308500000000000000000); // 308.500000000000000000
        recordAssetPrice(13, 307500000000000000000); // 307.500000000000000000
        recordAssetPrice(14, 306500000000000000000); // 306.500000000000000000
        recordAssetPrice(15, 305567800000000000000); // 305.567800000000000000
        recordAssetPrice(16, 304512345678987654321); // 304.512345678987654321
        recordAssetPrice(17, 303500000000000000000); // 303.500000000000000000
        recordAssetPrice(18, 302500000000000000000); // 302.500000000000000000
        recordAssetPrice(19, 301500000000000000000); // 301.500000000000000000


    }
    
    function recordAssetPrice(uint256 blockNumber, uint256 price) public auth {
        require(assetPriceRecords[blockNumber] == 0); // Price must not be set already.
        assetPriceRecords[blockNumber] = price;
        blocksWithPrice.push(blockNumber);
        emit AssetPriceRecorded(blockNumber, price);
    }

    function updateAssetPrice(uint256 blockNumber, uint256 price) public auth {
        require(assetPriceRecords[blockNumber] != 0); // Price must be set already.
        assetPriceRecords[blockNumber] = price;
        emit AssetPriceUpdated(blockNumber, price);
    }

    function getNumberOfBlocksWithPrice() public view returns (uint256) {
        return blocksWithPrice.length;
    }

    function getAssetPrice(uint256 blockNumber) public view returns (uint256 price) {
        return assetPriceRecords[blockNumber];
    }
}