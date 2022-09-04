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
    DEBUG
} from "../helper-hardhat-config";
import { delegate, reserve, transferNFT } from "../utils/governanceNFT-utils";

describe("4-Voting for proposals in Governor", async () => {
    let governor: GovernorContract;
    let governanceNFT: GovernanceNFT;
    let outsideNFT: GovernanceNFT;
    let encodedFunctionCall: string;

    let owner: SignerWithAddress;
    let quorumExactlyVotesVoter: SignerWithAddress;
    let quorumLessVotesVoter: SignerWithAddress;
    let withoutVotesVoter: SignerWithAddress;
    let voter1: SignerWithAddress;
    let voter2: SignerWithAddress;
    let voterWithDifferentToken: SignerWithAddress;

    let proposalId: number;
    const voteWayFor = 1; // 0 - against, 1 - for, 2 - abstain
    const voteWayAgainst = 0;
    const reason = "like it";

    beforeEach(async () => {
        await deployments.fixture(["all"]);
        [owner, quorumExactlyVotesVoter, quorumLessVotesVoter, withoutVotesVoter, voter1, voter2, voterWithDifferentToken,] =
            await ethers.getSigners();
        governor = await ethers.getContract("GovernorContract");
        governanceNFT = await ethers.getContract("GovernanceNFT");
        encodedFunctionCall = governor.interface.encodeFunctionData("incrementExecutedProposals");
        
        // second NFT
        await deployments.fixture(["all", "GovernanceNFT", "fakeNFT"])
        outsideNFT = await ethers.getContract("GovernanceNFT");
        
        //Transfer nft to addresses
        // await transferNFT(owner, proposer.address, 1);
        // await delegate(proposer, proposer.address);

        await transferNftToAccounts();
        await createProposal(governanceNFT);
                
    });

    const transferNftToAccounts = async () => {
        await reserve(governanceNFT, owner, 100);
        await delegate(governanceNFT, owner, owner.address);

        //transfer token to account for Test: Less than quorum needed votes
        await transferNFT(governanceNFT, owner, quorumLessVotesVoter.address, 1);
        await delegate(governanceNFT, quorumLessVotesVoter, quorumLessVotesVoter.address);

        //transfer token to account for Test: Exactly quorum needed votes
        const totalSupply = await governanceNFT.totalSupply();
        const quorumNeededVotes = (+totalSupply * QUORUM_PERCENTAGE) / 100;
        await transferNFT(governanceNFT,owner, quorumExactlyVotesVoter.address, quorumNeededVotes);
        await delegate(governanceNFT, quorumExactlyVotesVoter, quorumExactlyVotesVoter.address);

        //transfer NEARLY EQUAL amount of tokens to accounts for MULTI voting
        //voter1's votes > voter2's votes
        await transferNFT(governanceNFT, owner, voter1.address, quorumNeededVotes + 1);
        await delegate(governanceNFT, voter1, voter1.address);
        await transferNFT(governanceNFT, owner, voter2.address, quorumNeededVotes);
        await delegate(governanceNFT, voter2, voter2.address);


        // Multi tokens 
        await reserve(outsideNFT, owner, 1);
        await transferNFT(outsideNFT, owner, voterWithDifferentToken.address, 1);
        await delegate(outsideNFT, voterWithDifferentToken, voterWithDifferentToken.address);
        governor.addToken(outsideNFT.address);
    };

    const createProposal = async (GovernanceNFT: GovernanceNFT) => {
        const proposeTx = await governor.propose(
            [governor.address],
            [0],
            [encodedFunctionCall],
            PROPOSAL_DESCRIPTION,
            GovernanceNFT.address,
        );
        const proposeReceipt = await proposeTx.wait(1);
        proposalId = proposeReceipt.events![0].args!.proposalId;
        DEBUG ?
        console.log(`Proposal with id:${proposalId} created`) :
        ""

        await moveBlocks(VOTING_DELAY + 1);

        //1 - Active
        expect(await governor.state(proposalId)).equal(1);
        DEBUG ?
        console.log(`Current state of proposal(id:${proposalId}) is Active`) : ""
    };

    it("should vote for proposal, state after: Succeeded", async function () {
        
        DEBUG ?
        console.log(
            `Votes of voter: ${await governor.getVotes(
                owner.address,
                await governor.proposalSnapshot(proposalId),
                governanceNFT.address
            )}`
        ) : ""
        
        await governor.castVoteWithReason(proposalId, voteWayFor, reason);
        DEBUG ? console.log("Voted") : ''

        await moveBlocks(VOTING_PERIOD + 1);

        //4 - Succeeded
        expect(await governor.state(proposalId)).equal(4);
        DEBUG ? console.log("Succeeded"):''
    });

    it("should not vote for proposal, state after: Defeated", async function () {
        await moveBlocks(VOTING_PERIOD + 1);

        //3 - Defeated
        expect(await governor.state(proposalId)).equal(3);
        DEBUG ? console.log("Defeated") : ''
    });

    it("should vote but 0 balance, state after: Defeated", async function () {
        DEBUG ? console.log(
            `Votes of voter: ${await governor.getVotes(
                withoutVotesVoter.address,
                await governor.proposalSnapshot(proposalId),
                governanceNFT.address,
            )}`
        ) : "";

        await governor
            .connect(quorumLessVotesVoter)
            .castVoteWithReason(proposalId, voteWayFor, reason);

        DEBUG ? console.log("Voted") : ''

        await moveBlocks(VOTING_PERIOD + 1);

        //3 - Defeated
        expect(await governor.state(proposalId)).equal(3);
        DEBUG ? console.log("Defeated"): ''
    });

    it("should vote but not enough quorum, state after: Defeated", async function () {
        DEBUG ? console.log(
            `Votes of voter: ${await governor.getVotes(
                quorumLessVotesVoter.address,
                await governor.proposalSnapshot(proposalId),
                governanceNFT.address,
            )}`
        ) : "";

        await governor
            .connect(quorumLessVotesVoter)
            .castVoteWithReason(proposalId, voteWayFor, reason);
        DEBUG ? console.log("Voted") : ''

        await moveBlocks(VOTING_PERIOD + 1);

        //3 - Defeated
        expect(await governor.state(proposalId)).equal(3);
        DEBUG ? console.log("Defeated") : ''
    });

    it("[ERROR] should be create proposal, but can't vote for different proposal", async function(){
        DEBUG ? console.log(
            `Votes power of voter: ${await governor.getVotes(
                withoutVotesVoter.address,
                await governor.proposalSnapshot(proposalId),
                outsideNFT.address,
            )}`
        ) : "";
        
        expect(await governor.getTokenElement(1)).to.equal(outsideNFT.address);

        await expect(governor
            .connect(voterWithDifferentToken)
            .castVoteWithReason(proposalId, voteWayFor, reason)).revertedWith("Proposal token should be with voting power");
    })

    it("should vote with exactly quorum percentage votes, state after: Succeeded", async function () {
        DEBUG ? console.log(
            `Votes of voter (exactly quorum needed votes): ${await governor.getVotes(
                quorumExactlyVotesVoter.address,
                await governor.proposalSnapshot(proposalId),
                governanceNFT.address,
            )}`
        ) : ""

        await governor
            .connect(quorumExactlyVotesVoter)
            .castVoteWithReason(proposalId, voteWayFor, reason);
        DEBUG ? console.log("Voted") : ''

        await moveBlocks(VOTING_PERIOD + 1);

        //4 - Succeeded
        expect(await governor.state(proposalId)).equal(4);
        DEBUG ? console.log("Succeeded") : ''
    });

    it("should succeeded after multi voting", async function () {
        DEBUG ? console.log(
            `Votes of voter1: ${await governor.getVotes(
                voter1.address,
                await governor.proposalSnapshot(proposalId),
                governanceNFT.address,
            )}`
        ) : ''
        DEBUG ? console.log(
            `Votes of voter2: ${await governor.getVotes(
                voter2.address,
                await governor.proposalSnapshot(proposalId),
                governanceNFT.address,
            )}`
        ) : ''

        await governor.connect(voter1).castVote(proposalId, voteWayFor);
        await governor.connect(voter2).castVote(proposalId, voteWayAgainst);

        await moveBlocks(VOTING_PERIOD + 1);

        //4 - Succeeded
        expect(await governor.state(proposalId)).equal(4);
        DEBUG ? console.log("Succeeded") : ''
    });

    it("should defeated after multi voting", async function () {
        DEBUG ? console.log(
            `Votes of voter1: ${await governor.getVotes(
                voter1.address,
                await governor.proposalSnapshot(proposalId),
                governanceNFT.address,
            )}`
        ) : ''
        DEBUG ? console.log(
            `Votes of voter2: ${await governor.getVotes(
                voter2.address,
                await governor.proposalSnapshot(proposalId),
                governanceNFT.address,
            )}`
        ) : ''

        await governor.connect(voter1).castVote(proposalId, voteWayAgainst);
        await governor.connect(voter2).castVote(proposalId, voteWayFor);

        await moveBlocks(VOTING_PERIOD + 1);

        //4 - Defeated
        expect(await governor.state(proposalId)).equal(3);
        DEBUG ? console.log("Defeated") : ''
    });

    it("should revert after repeated voting", async function () {
        await governor.castVoteWithReason(proposalId, voteWayFor, reason);
        DEBUG ? console.log("Voted") : ''
        await expect(governor.castVoteWithReason(proposalId, voteWayFor, reason)).revertedWith(
            "GovernorVotingSimple: vote already cast'"
        );
    });

    it("should revert vote because voting period ended", async function () {
        await moveBlocks(VOTING_PERIOD);
        await expect(governor.castVoteWithReason(proposalId, voteWayFor, reason)).revertedWith(
            "Governor: vote not currently active"
        );
        DEBUG ? console.log("Voted") : ''
    });
});
