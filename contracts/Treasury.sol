// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Treasury is Ownable {
    event ProposalExecuted(uint256 executedProposals);

    uint256 public executedProposals;

    function execute() public onlyOwner {
        executedProposals++;
        emit ProposalExecuted(executedProposals);
    }

    function send(address to, uint256 amount) public onlyOwner {
        require(address(this).balance >= amount, "Not enough ETH");

        (bool sent, ) = to.call{value: amount}("");
        require(sent, "Failed to send Ether");

        execute();
    }

    receive() external payable {}

    fallback() external payable {}
}
