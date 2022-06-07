// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GovernanceToken is ERC20Votes, Ownable {
    uint256 private _initialSupply = 1_000_000 * (10**18);

    //add whitelist

    constructor(string memory _name, string memory _symbol)
        ERC20(_name, _symbol)
        ERC20Permit(_name)
    {
        _mint(msg.sender, _initialSupply);
    }
}
