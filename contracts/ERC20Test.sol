pragma solidity ^0.4.23;

import "../node_modules/zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

contract ERC20Test is MintableToken {
    string public constant name = "ERC20Test";
    string public constant symbol = "ERC20T";
    uint8 public constant decimals = 18;

    constructor() public {
        mint(msg.sender, 100000000000000000000);
        mint(0x186dD5595aF959809F0a4196cD6F7AA942861AaC, 100000000000000000000);
    }
}