import { ethers, deployments } from "hardhat";
import { GovernorContract, Treasury, GovernanceToken } from "../typechain-types";
import { moveBlocks } from "../utils/move-blocks";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
    FUNC,
    PROPOSAL_DESCRIPTION,
    QUORUM_PERCENTAGE,
    VOTING_DELAY,
    VOTING_PERIOD,
} from "../helper-hardhat-config";

describe("Voting for proposals in Governor", async () => {
    let governor: GovernorContract;
    let treasury: Treasury;
    let governanceToken: GovernanceToken;

    let encodedFunctionCall: string;

    let owner: SignerWithAddress;
    let quorumExactlyVotes: SignerWithAddress;
    let quorumLessVotes: SignerWithAddress;
    let withoutVotes: SignerWithAddress;
    let voter1: SignerWithAddress;
    let voter2: SignerWithAddress;

    let proposalId: number;
    const voteWayFor = 1; // 0 - against, 1 - for, 2 - abstain
    const voteWayAgainst = 0;
    const reason = "like it";

    beforeEach(async () => {
        await deployments.fixture(["all"]);
        [owner, quorumExactlyVotes, quorumLessVotes, withoutVotes, voter1, voter2] =
            await ethers.getSigners();
        governor = await ethers.getContract("GovernorContract");
        treasury = await ethers.getContract("Treasury");
        governanceToken = await ethers.getContract("GovernanceToken");
        encodedFunctionCall = treasury.interface.encodeFunctionData(FUNC);

        //Transfer tokens to accounts because ERC20Votes takes snapshot of delegated tokens in governor.proposalSnapshot(proposalId)
        await transferTokensToAccounts();

        await createProposal();
    });

    const transferTokensToAccounts = async () => {
        //transfer token to account for Test: Less than quorum needed votes
        await governanceToken.transfer(quorumLessVotes.address, ethers.utils.parseEther("200"));
        await governanceToken.connect(quorumLessVotes).delegate(quorumLessVotes.address);

        //transfer token to account for Test: Exactly quorum needed votes
        const totalSupply = ethers.utils.formatEther(await governanceToken.totalSupply());
        const quorumNeededVotes = (+totalSupply * QUORUM_PERCENTAGE) / 100;
        await governanceToken.transfer(
            quorumExactlyVotes.address,
            ethers.utils.parseEther(quorumNeededVotes.toString())
        );
        await governanceToken.connect(quorumExactlyVotes).delegate(quorumExactlyVotes.address);

        //transfer NEARLY EQUAL amount of tokens to accounts
        await governanceToken.transfer(voter1.address, ethers.utils.parseEther("100001"));
        await governanceToken.connect(voter1).delegate(voter1.address);
        await governanceToken.transfer(voter2.address, ethers.utils.parseEther("100000"));
        await governanceToken.connect(voter2).delegate(voter2.address);
    };

    const createProposal = async () => {
        const proposeTx = await governor.propose(
            [treasury.address],
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
            `Votes of voter: ${ethers.utils.formatEther(
                await governor.getVotes(owner.address, await governor.proposalSnapshot(proposalId))
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
            `Votes of voter: ${ethers.utils.formatEther(
                await governor.getVotes(
                    withoutVotes.address,
                    await governor.proposalSnapshot(proposalId)
                )
            )}`
        );

        await governor.connect(quorumLessVotes).castVoteWithReason(proposalId, voteWayFor, reason);
        console.log("Voted");

        await moveBlocks(VOTING_PERIOD + 1);

        //3 - Defeated
        expect(await governor.state(proposalId)).equal(3);
        console.log("Defeated");
    });

    it("should vote but not enough quorum, state after: Defeated", async function () {
        console.log(
            `Votes of voter: ${ethers.utils.formatEther(
                await governor.getVotes(
                    quorumLessVotes.address,
                    await governor.proposalSnapshot(proposalId)
                )
            )}`
        );

        await governor.connect(quorumLessVotes).castVoteWithReason(proposalId, voteWayFor, reason);
        console.log("Voted");

        await moveBlocks(VOTING_PERIOD + 1);

        //3 - Defeated
        expect(await governor.state(proposalId)).equal(3);
        console.log("Defeated");
    });

    it("should vote with exactly quorum percentage votes, state after: Succeeded", async function () {
        console.log(
            `Votes of voter (exactly quorum needed votes): ${ethers.utils.formatEther(
                await governor.getVotes(
                    quorumExactlyVotes.address,
                    await governor.proposalSnapshot(proposalId)
                )
            )}`
        );

        await governor
            .connect(quorumExactlyVotes)
            .castVoteWithReason(proposalId, voteWayFor, reason);
        console.log("Voted");

        await moveBlocks(VOTING_PERIOD + 1);

        //4 - Succeeded
        expect(await governor.state(proposalId)).equal(4);
        console.log("Succeeded");
    });

    it("should succeeded after multi voting", async function () {
        console.log(
            `Votes of voter1: ${ethers.utils.formatEther(
                await governor.getVotes(voter1.address, await governor.proposalSnapshot(proposalId))
            )}`
        );
        console.log(
            `Votes of voter2: ${ethers.utils.formatEther(
                await governor.getVotes(voter2.address, await governor.proposalSnapshot(proposalId))
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
            `Votes of voter1: ${ethers.utils.formatEther(
                await governor.getVotes(voter1.address, await governor.proposalSnapshot(proposalId))
            )}`
        );
        console.log(
            `Votes of voter2: ${ethers.utils.formatEther(
                await governor.getVotes(voter2.address, await governor.proposalSnapshot(proposalId))
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
