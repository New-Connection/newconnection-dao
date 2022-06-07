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

describe("Executing proposals in Governor", async () => {
    let governor: GovernorContract;
    let treasury: Treasury;
    let governanceToken: GovernanceToken;

    let encodedFunctionCall: string;
    let owner: SignerWithAddress;
    let proposer: SignerWithAddress;
    let failCanceler: SignerWithAddress;

    let proposalId: number;
    const voteWayFor = 1; // 0 - against, 1 - for, 2 - abstain
    const voteWayAgainst = 0;
    const reason = "like it";

    beforeEach(async () => {
        await deployments.fixture(["all"]);
        [owner, proposer, failCanceler] = await ethers.getSigners();
        governor = await ethers.getContract("GovernorContract");
        treasury = await ethers.getContract("Treasury");
        governanceToken = await ethers.getContract("GovernanceToken");
        encodedFunctionCall = treasury.interface.encodeFunctionData(FUNC);

        await transferTokensToAccounts();

        await treasury.transferOwnership(governor.address);
    });

    const createProposal = async (signer: SignerWithAddress) => {
        const proposeTx = await governor
            .connect(signer)
            .propose([treasury.address], [0], [encodedFunctionCall], PROPOSAL_DESCRIPTION);
        const proposeReceipt = await proposeTx.wait(1);
        proposalId = proposeReceipt.events![0].args!.proposalId;
        console.log(`Proposal with id:${proposalId} created`);
    };

    const transferTokensToAccounts = async () => {
        //transfer token to account for Test: Exactly quorum needed votes
        const totalSupply = ethers.utils.formatEther(await governanceToken.totalSupply());
        const quorumNeededVotes = (+totalSupply * QUORUM_PERCENTAGE) / 100;
        await governanceToken.transfer(
            proposer.address,
            ethers.utils.parseEther(quorumNeededVotes.toString())
        );
        await governanceToken.connect(proposer).delegate(proposer.address);
    };

    it("should execute proposal", async () => {
        await createProposal(owner);
        await moveBlocks(VOTING_DELAY + 1);
        console.log(
            `Current state of proposal(id:${proposalId}) is ${await governor.state(proposalId)}`
        );

        await governor.castVoteWithReason(proposalId, voteWayFor, reason);
        console.log("Voted for");
        await moveBlocks(VOTING_PERIOD + 1);
        console.log(
            `Current state of proposal(id:${proposalId}) is ${await governor.state(proposalId)}`
        );

        const executeTx = await governor.execute(
            [treasury.address],
            [0],
            [encodedFunctionCall],
            ethers.utils.id(PROPOSAL_DESCRIPTION)
        );
        await executeTx.wait(1);

        expect(await treasury.executedProposals()).equal(1);
    });

    it("should fail execute proposal (voting period not ended)", async () => {
        await createProposal(owner);
        await moveBlocks(VOTING_DELAY + 1);
        console.log(
            `Current state of proposal(id:${proposalId}) is ${await governor.state(proposalId)}`
        );

        await expect(
            governor.execute(
                [treasury.address],
                [0],
                [encodedFunctionCall],
                ethers.utils.id(PROPOSAL_DESCRIPTION)
            )
        ).revertedWith("Governor: proposal not successful");

        expect(await treasury.executedProposals()).equal(0);
    });

    it("should fail execute proposal (voting against)", async () => {
        await createProposal(owner);
        await moveBlocks(VOTING_DELAY + 1);
        console.log(
            `Current state of proposal(id:${proposalId}) is ${await governor.state(proposalId)}`
        );

        await governor.castVoteWithReason(proposalId, voteWayAgainst, reason);
        console.log("Voted against");
        await moveBlocks(VOTING_PERIOD + 1);
        console.log(
            `Current state of proposal(id:${proposalId}) is ${await governor.state(proposalId)}`
        );

        await expect(
            governor.execute(
                [treasury.address],
                [0],
                [encodedFunctionCall],
                ethers.utils.id(PROPOSAL_DESCRIPTION)
            )
        ).revertedWith("Governor: proposal not successful");

        expect(await treasury.executedProposals()).equal(0);
    });

    it("should fail execute proposal (not voting)", async () => {
        await createProposal(owner);
        await moveBlocks(VOTING_DELAY + 1);
        console.log(
            `Current state of proposal(id:${proposalId}) is ${await governor.state(proposalId)}`
        );

        await moveBlocks(VOTING_PERIOD + 1);
        console.log(
            `Current state of proposal(id:${proposalId}) is ${await governor.state(proposalId)}`
        );

        await expect(
            governor.execute(
                [treasury.address],
                [0],
                [encodedFunctionCall],
                ethers.utils.id(PROPOSAL_DESCRIPTION)
            )
        ).revertedWith("Governor: proposal not successful");

        expect(await treasury.executedProposals()).equal(0);
    });

    it("should cancel proposal by proposer", async function () {
        await createProposal(proposer);

        const cancelTx = await governor
            .connect(proposer)
            .cancel(
                [treasury.address],
                [0],
                [encodedFunctionCall],
                ethers.utils.id(PROPOSAL_DESCRIPTION)
            );
        await cancelTx.wait(1);

        expect(await governor.state(proposalId)).equal(2);
    });

    it("should cancel proposal by owner", async function () {
        await createProposal(proposer);

        const cancelTx = await governor
            .connect(owner)
            .cancel(
                [treasury.address],
                [0],
                [encodedFunctionCall],
                ethers.utils.id(PROPOSAL_DESCRIPTION)
            );
        await cancelTx.wait(1);

        console.log(await governor.state(proposalId));

        expect(await governor.state(proposalId)).equal(2);
    });

    it("should fail cancel proposal", async function () {
        await createProposal(proposer);

        await expect(
             governor
                .connect(failCanceler)
                .cancel(
                    [treasury.address],
                    [0],
                    [encodedFunctionCall],
                    ethers.utils.id(PROPOSAL_DESCRIPTION)
                )
        ).revertedWith("Not proposer or owner");
    });
});
