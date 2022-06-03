// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";

contract GovernorContract is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    //proposalId => proposer
    mapping(uint256 => address) private _proposers;

    constructor(
        string memory _name,
        IVotes _token,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumPercentage
    )
        //add to constructor
        Governor(_name)
        GovernorSettings(
            _votingDelay,
            _votingPeriod, /* 6545 blocks ~ 1 day */
            _proposalThreshold
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorumPercentage)
    {}

    function getProposer(uint256 proposalId) public view returns (address) {
        return _proposers[proposalId];
    }

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual override returns (uint256 proposalId) {
        proposalId = super.propose(targets, values, calldatas, description);
        _proposers[proposalId] = msg.sender;
    }
}
