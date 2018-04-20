pragma solidity ^0.4.21;

contract AssetPriceOracle {
    mapping(uint256 => uint256) public priceRecords;
    
    function recordPrice(uint256 timestamp, uint256 price) public {
        priceRecords[timestamp] = price;
    }
}