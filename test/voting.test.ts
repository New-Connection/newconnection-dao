import { ethers, deployments } from "hardhat";
import { GovernorContract, GovernanceNFT } from "../typechain-types";
import { moveBlocks } from "../utils/move-blocks";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
    PROPOSAL_DESCRIPTION,
    QUORUM_PERCENTAGE,
    VOTING_DELAY,
    VOTING_PERIOD,
} from "../helper-hardhat-config";
import { delegate, reserve, transferNFT } from "../utils/governanceNFT-utils";

describe("Voting for proposals in Governor", async () => {
    let governor: GovernorContract;
    let governanceNFT: GovernanceNFT;

    let encodedFunctionCall: string;

    let owner: SignerWithAddress;
    let quorumExactlyVotesVoter: SignerWithAddress;
    let quorumLessVotesVoter: SignerWithAddress;
    let withoutVotesVoter: SignerWithAddress;
    let voter1: SignerWithAddress;
    let voter2: SignerWithAddress;

    let proposalId: number;
    const voteWayFor = 1; // 0 - against, 1 - for, 2 - abstain
    const voteWayAgainst = 0;
    const reason = "like it";

    beforeEach(async () => {
        await deployments.fixture(["all"]);
        [owner, quorumExactlyVotesVoter, quorumLessVotesVoter, withoutVotesVoter, voter1, voter2] =
            await ethers.getSigners();
        governor = await ethers.getContract("GovernorContract");
        governanceNFT = await ethers.getContract("GovernanceNFT");
        encodedFunctionCall = governor.interface.encodeFunctionData("incrementExecutedProposals");

        //Transfer nft to addresses
        // await transferNFT(owner, proposer.address, 1);
        // await delegate(proposer, proposer.address);
        await transferNftToAccounts();

        await createProposal();
    });

    const transferNftToAccounts = async () => {
        await reserve(owner, 100);
        await delegate(owner, owner.address);

        //transfer token to account for Test: Less than quorum needed votes
        await transferNFT(owner, quorumLessVotesVoter.address, 1);
        await delegate(quorumLessVotesVoter, quorumLessVotesVoter.address);

        //transfer token to account for Test: Exactly quorum needed votes
        const totalSupply = await governanceNFT.totalSupply();
        const quorumNeededVotes = (+totalSupply * QUORUM_PERCENTAGE) / 100;
        await transferNFT(owner, quorumExactlyVotesVoter.address, quorumNeededVotes);
        await delegate(quorumExactlyVotesVoter, quorumExactlyVotesVoter.address);

        //transfer NEARLY EQUAL amount of tokens to accounts for MULTI voting
        //voter1's votes > voter2's votes
        await transferNFT(owner, voter1.address, quorumNeededVotes + 1);
        await delegate(voter1, voter1.address);
        await transferNFT(owner, voter2.address, quorumNeededVotes);
        await delegate(voter2, voter2.address);
    };

    const createProposal = async () => {
        const proposeTx = await governor.propose(
            [governor.address],
            [0],
            [encodedFunctionCall],
            PROPOSAL_DESCRIPTION
        );
        const proposeReceipt = await proposeTx.wait(1);
        proposalId = proposeReceipt.events![0].args!.proposalId;
        console.log(`Proposal with id:${proposalId} created`);

        await moveBlocks(VOTING_DELAY + 1);

        //1 - Active
        expect(await governor.state(proposalId)).equal(1);
        console.log(`Current state of proposal(id:${proposalId}) is Active`);
    };

    it("should vote for proposal, state after: Succeeded", async function () {
        console.log(
            `Votes of voter: ${await governor.getVotes(
                owner.address,
                await governor.proposalSnapshot(proposalId)
            )}`
        );

        await governor.castVoteWithReason(proposalId, voteWayFor, reason);
        console.log("Voted");

        await moveBlocks(VOTING_PERIOD + 1);

        //4 - Succeeded
        expect(await governor.state(proposalId)).equal(4);
        console.log("Succeeded");
    });

    it("should not vote for proposal, state after: Defeated", async function () {
        await moveBlocks(VOTING_PERIOD + 1);

        //3 - Defeated
        expect(await governor.state(proposalId)).equal(3);
        console.log("Defeated");
    });

    it("should vote but 0 balance, state after: Defeated", async function () {
        console.log(
            `Votes of voter: ${await governor.getVotes(
                withoutVotesVoter.address,
                await governor.proposalSnapshot(proposalId)
            )}`
        );

        await governor
            .connect(quorumLessVotesVoter)
            .castVoteWithReason(proposalId, voteWayFor, reason);
        console.log("Voted");

        await moveBlocks(VOTING_PERIOD + 1);

        //3 - Defeated
        expect(await governor.state(proposalId)).equal(3);
        console.log("Defeated");
    });

    it("should vote but not enough quorum, state after: Defeated", async function () {
        console.log(
            `Votes of voter: ${await governor.getVotes(
                quorumLessVotesVoter.address,
                await governor.proposalSnapshot(proposalId)
            )}`
        );

        await governor
            .connect(quorumLessVotesVoter)
            .castVoteWithReason(proposalId, voteWayFor, reason);
        console.log("Voted");

        await moveBlocks(VOTING_PERIOD + 1);

        //3 - Defeated
        expect(await governor.state(proposalId)).equal(3);
        console.log("Defeated");
    });

    it("should vote with exactly quorum percentage votes, state after: Succeeded", async function () {
        console.log(
            `Votes of voter (exactly quorum needed votes): ${await governor.getVotes(
                quorumExactlyVotesVoter.address,
                await governor.proposalSnapshot(proposalId)
            )}`
        );

        await governor
            .connect(quorumExactlyVotesVoter)
            .castVoteWithReason(proposalId, voteWayFor, reason);
        console.log("Voted");

        await moveBlocks(VOTING_PERIOD + 1);

        //4 - Succeeded
        expect(await governor.state(proposalId)).equal(4);
        console.log("Succeeded");
    });

    it("should succeeded after multi voting", async function () {
        console.log(
            `Votes of voter1: ${await governor.getVotes(
                voter1.address,
                await governor.proposalSnapshot(proposalId)
            )}`
        );
        console.log(
            `Votes of voter2: ${await governor.getVotes(
                voter2.address,
                await governor.proposalSnapshot(proposalId)
            )}`
        );

        await governor.connect(voter1).castVote(proposalId, voteWayFor);
        await governor.connect(voter2).castVote(proposalId, voteWayAgainst);

        await moveBlocks(VOTING_PERIOD + 1);

        //4 - Succeeded
        expect(await governor.state(proposalId)).equal(4);
        console.log("Succeeded");
    });

    it("should defeated after multi voting", async function () {
        console.log(
            `Votes of voter1: ${await governor.getVotes(
                voter1.address,
                await governor.proposalSnapshot(proposalId)
            )}`
        );
        console.log(
            `Votes of voter2: ${await governor.getVotes(
                voter2.address,
                await governor.proposalSnapshot(proposalId)
            )}`
        );

        await governor.connect(voter1).castVote(proposalId, voteWayAgainst);
        await governor.connect(voter2).castVote(proposalId, voteWayFor);

        await moveBlocks(VOTING_PERIOD + 1);

        //4 - Defeated
        expect(await governor.state(proposalId)).equal(3);
        console.log("Defeated");
    });

    it("should revert after repeated voting", async function () {
        await governor.castVoteWithReason(proposalId, voteWayFor, reason);
        console.log("Voted");
        await expect(governor.castVoteWithReason(proposalId, voteWayFor, reason)).revertedWith(
            "GovernorVotingSimple: vote already cast'"
        );
    });

    it("should revert vote because voting period ended", async function () {
        await moveBlocks(VOTING_PERIOD);

        await expect(governor.castVoteWithReason(proposalId, voteWayFor, reason)).revertedWith(
            "Governor: vote not currently active"
        );
        console.log("Voted");
    });
});
