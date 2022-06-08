// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GovernorContract is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    Ownable
{
    //proposalId => proposer
    mapping(uint256 => address) private _proposers;

    //proposalId => proposalInfoURI
    mapping(uint256 => string) private _proposalsInfoURIs;

    string private _governorInfoURI;

    constructor(
        string memory name_, /* unable to change */
        IVotes token_, /* unable to change */
        uint256 votingDelay_,
        uint256 votingPeriod_,
        uint256 proposalThreshold_,
        uint256 quorumPercentage_
    )
        //add to constructor
        Governor(name_)
        GovernorSettings(
            votingDelay_,
            votingPeriod_, /* 6545 blocks ~ 1 day */
            proposalThreshold_
        )
        GovernorVotes(token_)
        GovernorVotesQuorumFraction(quorumPercentage_)
    {}

    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function getProposer(uint256 proposalId) public view returns (address) {
        return _proposers[proposalId];
    }

    function governorInfoURI() public view returns (string memory) {
        return _governorInfoURI;
    }

    function proposalInfoURI(uint256 proposalId) public view returns (string memory) {
        return _proposalsInfoURIs[proposalId];
    }

    function setGovernorInfoURI(string memory newInfoURI) public onlyOwner {
        _governorInfoURI = newInfoURI;
    }

    function setProposalInfoURI(uint256 proposalId, string memory infoURI) public {
        require(getProposer(proposalId) == _msgSender(), "Not proposer");
        _proposalsInfoURIs[proposalId] = infoURI;
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual override returns (uint256) {
        uint256 proposalId = super.propose(targets, values, calldatas, description);
        _proposers[proposalId] = _msgSender();
        return proposalId;
    }

    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public returns (uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);
        require(
            getProposer(proposalId) == _msgSender() || owner() == _msgSender(),
            "Not proposer or owner"
        );

        return super._cancel(targets, values, calldatas, descriptionHash);
    }
}
