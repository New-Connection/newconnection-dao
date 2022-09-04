import { ethers, deployments } from "hardhat";
import { GovernorContract, Treasury, GovernanceNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { delegate, reserve, transferNFT } from "../utils/governanceNFT-utils";
import { VOTING_DELAY, VOTING_PERIOD, DEBUG } from "../helper-hardhat-config";
import { moveBlocks } from "../utils/move-blocks";

describe("5 - Test treasury functions", async () => {
    let governor: GovernorContract;
    let treasury: Treasury;
    let governanceNFT: GovernanceNFT;

    let treasurySendFunctionCall: string;
    let proposalId: number;
    const sendProposalDescription = "send 1 eth to receiver";
    const amountToSend = ethers.utils.parseEther("1");
    const voteWayFor = 1; // 0 - against, 1 - for, 2 - abstain
    const voteWayAgainst = 0;

    let owner: SignerWithAddress;
    let voter1: SignerWithAddress;
    let voter2: SignerWithAddress;
    let receiver: SignerWithAddress;

    beforeEach(async () => {
        await deployments.fixture(["all"]);
        [owner, receiver, voter1, voter2] = await ethers.getSigners();

        governor = await ethers.getContract("GovernorContract");
        treasury = await ethers.getContract("Treasury");
        governanceNFT = await ethers.getContract("GovernanceNFT");

        treasurySendFunctionCall = treasury.interface.encodeFunctionData("send", [
            receiver.address,
            amountToSend,
        ]);

        await transferNftToAccounts();

        await owner.sendTransaction({
            to: treasury.address,
            value: amountToSend.mul(2),
        });
    });

    const transferNftToAccounts = async () => {
        await reserve(governanceNFT, owner, 20);
        await delegate(governanceNFT, owner, owner.address);

        //voter1's votes > voter2's votes
        await transferNFT(governanceNFT, owner, voter1.address, 6);
        await delegate(governanceNFT, voter1, voter1.address);
        await transferNFT(governanceNFT, owner, voter2.address, 4);
        await delegate(governanceNFT, voter2, voter2.address);
    };

    const createSendProposal = async () => {
        const proposeTx = await governor
            .connect(owner)
            .propose([treasury.address], [0], [treasurySendFunctionCall], sendProposalDescription, governanceNFT.address);
        const proposeReceipt = await proposeTx.wait(1);
        proposalId = proposeReceipt.events![0].args!.proposalId;

        await moveBlocks(VOTING_DELAY + 1);

        //1 - Active
        expect(await governor.state(proposalId)).equal(1);
        DEBUG ? 
        console.log(`Proposal with id:${proposalId} created`) : ""
    };

    it("should increment treasury's counter", async function () {
        const executeTx = await treasury.execute();
        await executeTx.wait(1);

        expect(await treasury.executedProposals()).equal(1);
    });

    it("should send ETH to receiver", async function () {
        const receiverBalanceBeforeSend = await ethers.provider.getBalance(receiver.address);
        const sendTx = await treasury.send(receiver.address, amountToSend);
        await sendTx.wait(1);

        expect(await ethers.provider.getBalance(receiver.address)).equal(
            receiverBalanceBeforeSend.add(amountToSend)
        );
    });

    it("should send after voting (voting for)", async function () {
        await treasury.connect(owner).transferOwnership(governor.address);

        const receiverBalanceBefore = await ethers.provider.getBalance(receiver.address);
        DEBUG ? console.log(
            `receiver balance before proposal execution: ${ethers.utils.formatEther(
                receiverBalanceBefore
            )}`
        ) : ''

        await createSendProposal();
        //voteWayFor > voteWayAgainst
        await governor.connect(voter1).castVote(proposalId, voteWayFor);
        await governor.connect(voter2).castVote(proposalId, voteWayAgainst);

        await moveBlocks(VOTING_PERIOD + 1);
        //4 - Succeeded
        expect(await governor.state(proposalId)).equal(4);

        const executeTx = await governor.execute(
            [treasury.address],
            [0],
            [treasurySendFunctionCall],
            ethers.utils.id(sendProposalDescription)
        );
        await executeTx.wait(1);

        const receiverBalanceAfter = await ethers.provider.getBalance(receiver.address);
        DEBUG ? console.log(
            `receiver balance after proposal execution: ${ethers.utils.formatEther(
                receiverBalanceAfter
            )}`
        ) : ''

        expect(receiverBalanceBefore.add(amountToSend)).equal(receiverBalanceAfter);
    });

    it("should not send after voting (voting against)", async function () {
        await treasury.connect(owner).transferOwnership(governor.address);

        const receiverBalanceBefore = await ethers.provider.getBalance(receiver.address);
        DEBUG ? console.log(
            `receiver balance before proposal execution: ${ethers.utils.formatEther(
                receiverBalanceBefore
            )}`
        ) : ''

        await createSendProposal();
        //voteWayAgainst > voteWayFor
        await governor.connect(voter1).castVote(proposalId, voteWayAgainst);
        await governor.connect(voter2).castVote(proposalId, voteWayFor);

        await moveBlocks(VOTING_PERIOD + 1);
        //3 - Defeated
        expect(await governor.state(proposalId)).equal(3);

        await expect(
            governor.execute(
                [treasury.address],
                [0],
                [treasurySendFunctionCall],
                ethers.utils.id(sendProposalDescription)
            )
        ).revertedWith("Governor: proposal not successful'");

        const receiverBalanceAfter = await ethers.provider.getBalance(receiver.address);
        DEBUG ? console.log(
            `receiver balance after proposal execution: ${ethers.utils.formatEther(
                receiverBalanceAfter
            )}`
        ) : ''

        expect(receiverBalanceBefore).equal(receiverBalanceAfter);
    });

    it("should receive money from fallback function", async function () {
        const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);

        const data = ethers.utils.id("data");
        await owner.sendTransaction({
            to: treasury.address,
            value: amountToSend,
            data: data,
        });

        const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);

        expect(treasuryBalanceBefore.add(amountToSend)).equal(treasuryBalanceAfter);
    });

    it("should fail send ETH to receiver", async function () {
        await expect(treasury.send(receiver.address, amountToSend.mul(100))).revertedWith(
            "Not enough ETH"
        );
    });
});
