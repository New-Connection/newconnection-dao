// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GovernanceToken is ERC20Votes, Ownable {
    uint256 private _initialSupply = 1_000_000 * (10**18);

    mapping(address => uint256) private _claimList;

    constructor(string memory _name, string memory _symbol)
        ERC20(_name, _symbol)
        ERC20Permit(_name)
    {
        _mint(msg.sender, _initialSupply);
    }

    function amountAvailableToClaim(address addr) public view returns (uint256) {
        return _claimList[addr];
    }

    function setClaimList(address[] calldata addresses, uint256 amount) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            _claimList[addresses[i]] = amount;
        }
    }

    function claim(uint256 amount) external {
        require(amount <= amountAvailableToClaim(msg.sender), "Exceeded max available to claim");

        _claimList[msg.sender] -= amount;

        _mint(msg.sender, amount);
    }
}
