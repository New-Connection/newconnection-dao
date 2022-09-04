import { ethers, deployments } from "hardhat";
import { GovernorContract, GovernanceNFT } from "../typechain-types";
import { moveBlocks } from "../utils/move-blocks";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { PROPOSAL_DESCRIPTION, VOTING_DELAY, VOTING_PERIOD } from "../helper-hardhat-config";
import { delegate, reserve, transferNFT } from "../utils/governanceNFT-utils";
import { DEBUG } from "../helper-hardhat-config";

describe("3-Executing proposals in Governor", async () => {
    let governor: GovernorContract;
    let governanceNFT: GovernanceNFT;
    let outsideNFT: GovernanceNFT;

    let encodedFunctionCall: string;
    let owner: SignerWithAddress;
    let proposer: SignerWithAddress;
    let failCanceler: SignerWithAddress;

    const voteWayFor = 1; // 0 - against, 1 - for, 2 - abstain
    const voteWayAgainst = 0;
    const reason = "like it";

    beforeEach(async () => {
        await deployments.fixture(["all"]);
        [owner, proposer, failCanceler] = await ethers.getSigners();
        governor = await ethers.getContract("GovernorContract");
        governanceNFT = await ethers.getContract("GovernanceNFT");
        encodedFunctionCall = governor.interface.encodeFunctionData("incrementExecutedProposals");

        await reserve(governanceNFT, owner, 2);
        await delegate(governanceNFT, owner, owner.address);

        await transferNFT(governanceNFT, owner, proposer.address, 1);
        await delegate(governanceNFT, proposer, proposer.address);

        await deployments.fixture(["all", "GovernanceNFT", "fakeNFT"])
        outsideNFT = await ethers.getContract("GovernanceNFT");
        await reserve(outsideNFT, owner, 2);
        await transferNFT(outsideNFT, owner, proposer.address, 1);
        await delegate(outsideNFT, proposer, proposer.address)
        governor.addToken(outsideNFT.address);
        
    });

    const createProposal = async (signer: SignerWithAddress, tokenAddress: GovernanceNFT): Promise<number> => {
        const proposeTx = await governor
            .connect(signer)
            .propose([governor.address], [0], [encodedFunctionCall], PROPOSAL_DESCRIPTION, tokenAddress.address);
        const proposeReceipt = await proposeTx.wait(1);
        const proposalId = proposeReceipt.events![0].args!.proposalId;
        await moveBlocks(VOTING_DELAY + 1);

        //1 - Active
        expect(await governor.state(proposalId)).equal(1);
        DEBUG ? console.log(`Proposal with id:${proposalId} created`) : ''
        return proposalId;
    };

    it("should execute proposal", async () => {
        const proposalId = await createProposal(owner, governanceNFT);

        DEBUG ? console.log(
            `Current state of proposal(id:${proposalId}) is ${await governor.state(proposalId)}`
        ) : ''

        await governor.castVoteWithReason(proposalId, voteWayFor, reason);
        
        await moveBlocks(VOTING_PERIOD + 1);
        DEBUG ? 
        console.log(
            `Current state of proposal(id:${proposalId}) is ${await governor.state(proposalId)}`
        ) : ''

        const executeTx = await governor.execute(
            [governor.address],
            [0],
            [encodedFunctionCall],
            ethers.utils.id(PROPOSAL_DESCRIPTION)
        );
        await executeTx.wait(1);

        expect(await governor.getExecutedProposals()).equal(1);
    });

    it("should fail execute proposal (voting period not ended)", async () => {
        const proposalId = await createProposal(owner, governanceNFT);
        await moveBlocks(VOTING_DELAY + 1);
        DEBUG ? console.log(
            `Current state of proposal(id:${proposalId}) is ${await governor.state(proposalId)}`
        ) : ''

        await expect(
            governor.execute(
                [governor.address],
                [0],
                [encodedFunctionCall],
                ethers.utils.id(PROPOSAL_DESCRIPTION)
            )
        ).revertedWith("Governor: proposal not successful");

        expect(await governor.getExecutedProposals()).equal(0);
    });

    it("should fail execute proposal (voting against)", async () => {
        const proposalId = await createProposal(owner, governanceNFT);
        await moveBlocks(VOTING_DELAY + 1);
        DEBUG ? console.log(
            `Current state of proposal(id:${proposalId}) is ${await governor.state(proposalId)}`
        ) : ''

        await governor.castVoteWithReason(proposalId, voteWayAgainst, reason);
        DEBUG ? console.log("Voted against") : ''
        await moveBlocks(VOTING_PERIOD + 1);
        DEBUG ? console.log(
            `Current state of proposal(id:${proposalId}) is ${await governor.state(proposalId)}`
        ) : ''

        await expect(
            governor.execute(
                [governor.address],
                [0],
                [encodedFunctionCall],
                ethers.utils.id(PROPOSAL_DESCRIPTION)
            )
        ).revertedWith("Governor: proposal not successful");

        expect(await governor.getExecutedProposals()).equal(0);
    });

    it("should fail execute proposal (not voting)", async () => {
        const proposalId = await createProposal(owner, governanceNFT);
        await moveBlocks(VOTING_DELAY + 1);
        
        DEBUG ? console.log(
            `Current state of proposal(id:${proposalId}) is ${await governor.state(proposalId)}`
        ) : ''

        await moveBlocks(VOTING_PERIOD + 1);
        DEBUG ? console.log(
            `Current state of proposal(id:${proposalId}) is ${await governor.state(proposalId)}`
        ) : ''

        await expect(
            governor.execute(
                [governor.address],
                [0],
                [encodedFunctionCall],
                ethers.utils.id(PROPOSAL_DESCRIPTION)
            )
        ).revertedWith("Governor: proposal not successful");

        expect(await governor.getExecutedProposals()).equal(0);
    });

    it("should cancel proposal by proposer", async function () {
        const proposalId = await createProposal(proposer, governanceNFT);

        const cancelTx = await governor
            .connect(proposer)
            .cancel(
                [governor.address],
                [0],
                [encodedFunctionCall],
                ethers.utils.id(PROPOSAL_DESCRIPTION)
            );
        await cancelTx.wait(1);

        expect(await governor.state(proposalId)).equal(2);
    });

    it("should cancel proposal by owner", async function () {
        const proposalId = await createProposal(proposer, governanceNFT);

        const cancelTx = await governor
            .connect(owner)
            .cancel(
                [governor.address],
                [0],
                [encodedFunctionCall],
                ethers.utils.id(PROPOSAL_DESCRIPTION)
            );
        await cancelTx.wait(1);

        DEBUG ? console.log(await governor.state(proposalId)) : ''

        expect(await governor.state(proposalId)).equal(2);
    });

    it("should fail cancel proposal", async function () {
        await createProposal(proposer, governanceNFT);
        await expect(
            governor
                .connect(failCanceler)
                .cancel(
                    [governor.address],
                    [0],
                    [encodedFunctionCall],
                    ethers.utils.id(PROPOSAL_DESCRIPTION)
                )
        ).revertedWith("Not proposer or owner");
    });

    // MULTITOKENS
    it("should cancel proposal by proposer", async function () {
        const proposalId = await createProposal(proposer, outsideNFT);

        const cancelTx = await governor
            .connect(proposer)
            .cancel(
                [governor.address],
                [0],
                [encodedFunctionCall],
                ethers.utils.id(PROPOSAL_DESCRIPTION)
            );
        await cancelTx.wait(1);

        expect(await governor.state(proposalId)).equal(2);
    });

    it("should fail cancel proposal", async function () {
        await createProposal(proposer, outsideNFT);
        await expect(
            governor
                .connect(failCanceler)
                .cancel(
                    [governor.address],
                    [0],
                    [encodedFunctionCall],
                    ethers.utils.id(PROPOSAL_DESCRIPTION)
                )
        ).revertedWith("Not proposer or owner");
    });
});
