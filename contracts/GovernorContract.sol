// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "./GovernorMultiTokens/GovernorVotesQuorumFraction.sol";
import "./GovernorMultiTokens/GovernorVotes.sol";
import "./GovernorMultiTokens/GovernorMulti.sol";
import "./GovernorMultiTokens/GovernorSettingsMulti.sol";
import "./GovernorMultiTokens/GovernorCountingSimpleMulti.sol";

contract GovernorContract is
    GovernorMulti,
    GovernorSettingsMulti,
    GovernorCountingSimpleMulti,
    GovernorVotes,
    GovernorVotesQuorumFraction
{
    //proposalId => proposer
    mapping(uint256 => address) private _proposers;

    //proposalId => proposalInfoURI
    mapping(uint256 => string) private _proposalsInfoURIs;

    string private _governorInfoURI;

    uint256 private _totalProposals;
    uint256 private _executedProposals;

    constructor(
        string memory name_, /* unable to change */
        IVotes token_, /* unable to change */
        uint256 votingPeriod_,
        uint256 quorumPercentage_
    )
        GovernorMulti(name_)
        GovernorSettingsMulti(
            1,
            votingPeriod_, /* 6545 blocks ~ 1 day */
            1
        )
        GovernorVotes(token_)
        GovernorVotesQuorumFraction(quorumPercentage_)
    {}

    function proposalThreshold()
        public
        view
        override(GovernorMulti, GovernorSettingsMulti)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function getTotalProposals() public view returns (uint256) {
        return _totalProposals;
    }

    function getExecutedProposals() public view returns (uint256) {
        return _executedProposals;
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
        string memory description,
        IVotes tokenAddress
    ) public virtual override tokenExist(tokenAddress) returns (uint256) {
        uint256 proposalId = super.propose(targets, values, calldatas, description, tokenAddress);
        _proposers[proposalId] = _msgSender();
        _totalProposals++;
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

    function version() public pure override returns (string memory) {
        return "2.0";
    }
    function incrementExecutedProposals() public onlyGovernance {
        _executedProposals++;
    }
}
