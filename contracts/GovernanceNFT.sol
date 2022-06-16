// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/draft-ERC721Votes.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GovernanceNFT is ERC721, ERC721Enumerable, EIP712, ERC721Votes, Ownable {
    uint256 public immutable maxSupply;
    string private _baseURIextended;
    mapping(address => uint8) private _allowList;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_
    ) ERC721(name_, symbol_) EIP712(name_, "1") {
        maxSupply = maxSupply_;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseURIextended;
    }

    function mint() external {
        uint256 supply = totalSupply();
        require(_allowList[msg.sender] >= 1, "Exceeded max available to purchase");
        require(supply + 1 <= maxSupply, "Purchase would exceed max tokens");

        _allowList[msg.sender] -= 1;

        _safeMint(msg.sender, supply);
    }

    function setAllowList(address[] calldata addresses, uint8 numAllowedToMint) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            _allowList[addresses[i]] = numAllowedToMint;
        }
    }

    function reserve(uint256 amount) public onlyOwner {
        uint256 supply = totalSupply();
        require(supply + amount <= maxSupply, "Purchase would exceed max tokens");

        for (uint256 i = 0; i < amount; i++) {
            _safeMint(msg.sender, supply + i);
        }
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseURIextended = baseURI;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Votes) {
        super._afterTokenTransfer(from, to, tokenId);
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }
}
