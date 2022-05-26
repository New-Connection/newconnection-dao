import { ethers, deployments } from "hardhat";
import { GovernorContract } from "../typechain-types";
import { BigNumber, Contract, Signer } from "ethers";
import { assert } from "chai";
import { moveBlocks } from "../utils/move-blocks";

describe("Propose to Governor", async () => {
    let governor: GovernorContract;
    let governanceToken;

    const proposalDescription = "Test proposal";
    beforeEach(async () => {
        await deployments.fixture(["all"]);
        governor = await ethers.getContract("GovernorContract");
    });

    it("should create proposal", async function () {
        const proposeTx = await governor.propose([], [], [], proposalDescription);
        const proposeReceipt = await proposeTx.wait(1);
    });
});
