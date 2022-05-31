import { ethers, deployments } from "hardhat";
import { GovernorContract, Treasury, GovernanceToken } from "../typechain-types";
import { moveBlocks } from "../utils/move-blocks";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
    FUNC,
    PROPOSAL_DESCRIPTION,
    PROPOSAL_THRESHOLD,
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

    let proposalId: number;
    // 0 - againts, 1 - for, 2 - abstain
    const voteWay = 1;
    const reason = "like it";

    beforeEach(async () => {
        await deployments.fixture(["all"]);
        [owner, quorumExactlyVotes, quorumLessVotes, withoutVotes] = await ethers.getSigners();
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

        await governor.castVoteWithReason(proposalId, voteWay, reason);
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

        await governor.connect(quorumLessVotes).castVoteWithReason(proposalId, voteWay, reason);
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

        await governor.connect(quorumLessVotes).castVoteWithReason(proposalId, voteWay, reason);
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

        await governor.connect(quorumExactlyVotes).castVoteWithReason(proposalId, voteWay, reason);
        console.log("Voted");

        await moveBlocks(VOTING_PERIOD + 1);

        //4 - Succeeded
        expect(await governor.state(proposalId)).equal(4);
        console.log("Succeeded");
    });
});
