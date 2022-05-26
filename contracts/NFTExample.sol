// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract NFTExample is ERC721 {
    constructor() ERC721("NFTExample", "NFTE") {}
}
