// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/draft-ERC721Votes.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "./layerzero/token/onft/ONFT721.sol";

contract GovernanceNFT is ERC721, ERC721Enumerable, EIP712, ERC721Votes, ONFT721 {
    uint256 public immutable pricePerToken;
    uint256 public nextMintId;
    uint256 public maxMintId;
    string private _baseURIextended;
    mapping(address => uint8) private _allowList;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 priceInEther,
        address layerZeroEndpoint_,
        uint256 startMintId_,
        uint256 endMintId_
    ) ONFT721(name_, symbol_, layerZeroEndpoint_) EIP712(name_, "1") {
        nextMintId = startMintId_;
        maxMintId = endMintId_;
        pricePerToken = priceInEther;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721Enumerable, ONFT721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function baseURI() public view returns (string memory) {
        return _baseURI();
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);

        return _baseURI();
    }

    function numAvailableToMint(address addr) external view returns (uint8) {
        return _allowList[addr];
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseURIextended;
    }

    function mint() external payable {
        require(_allowList[msg.sender] >= 1, "Exceeded max available to mint");
        require(nextMintId <= maxMintId, "Max mint limit reached");
        require(msg.value >= pricePerToken, "Not enough ETH");

        _allowList[msg.sender] -= 1;

        uint256 newId = nextMintId;
        nextMintId++;

        _safeMint(msg.sender, newId);
    }

    function setAllowList(address[] calldata addresses, uint8 numAllowedToMint) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            _allowList[addresses[i]] = numAllowedToMint;
        }
    }

    function reserve(uint256 amount) public onlyOwner {
        require(nextMintId + (amount - 1) <= maxMintId, "Max mint limit reached");

        for (uint256 i = 0; i < amount; i++) {
            uint256 newId = nextMintId;
            nextMintId++;
            _safeMint(msg.sender, newId);
        }
    }

    function setBaseURI(string memory baseURI_) external onlyOwner {
        _baseURIextended = baseURI_;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool sent, ) = msg.sender.call{value: balance}("");
        require(sent, "Failed to send Ether");
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
}
