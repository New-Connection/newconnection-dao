// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

// import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";
import "hardhat/console.sol";
import "./GovernorMulti.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract GovernorVotes is GovernorMulti, Ownable {
    IVotes[] public token;

    mapping(IVotes => bool) public addressIsAlreadyExist;

    constructor(IVotes tokenAddress) {
        token.push(tokenAddress);
        addressIsAlreadyExist[tokenAddress] = true;
    }

    modifier checkTokenAddress(IVotes tokenAddress) {
        require(!addressIsAlreadyExist[tokenAddress], "GovernorVotes: This address is already exist");
        _;
    }

    modifier tokenExist(IVotes tokenAddress) {
        require(addressIsAlreadyExist[tokenAddress], "GovernorVotes: Address should added into DAO");
        _;
    }

    /**
     * Read the voting weight from the token's built in snapshot mechanism (see {Governor-_getVotes}).
     */
    function _getVotes(
        address account,
        uint256 blockNumber,
        IVotes tokenAddress,
        bytes memory /*params*/
    ) internal view virtual override returns (uint256) {
        return tokenAddress.getPastVotes(account, blockNumber);
    }

    /**
     * Add more ERC721/20 tokens into array of tokens
     * Only owner can add token into DAO
     */
    function addToken(IVotes tokenAddress) public virtual onlyOwner checkTokenAddress(tokenAddress) {
        require(address(tokenAddress) != address(0), "Address should non-zero");
        token.push(tokenAddress);
        addressIsAlreadyExist[tokenAddress] = true;
    }

    /**
     * How many tokens in DAO which can vote
     */
    function getTokensLength() public view virtual returns (uint256) {
        uint256 x = token.length;
        return x;
    }

    function getTokenElement(uint8 index) public view virtual returns (IVotes) {
        return token[index];
    }
}
