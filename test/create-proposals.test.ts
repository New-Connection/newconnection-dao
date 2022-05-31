import { ethers, deployments } from "hardhat";
import { GovernorContract, Treasury, GovernanceToken } from "../typechain-types";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { FUNC, PROPOSAL_DESCRIPTION } from "../helper-hardhat-config";

describe("Propose to Governor", async () => {
    let governor: GovernorContract;
    let treasury: Treasury;
    let governanceToken: GovernanceToken;

    let encodedFunctionCall: string;

    let owner: SignerWithAddress, addr1: SignerWithAddress;

    beforeEach(async () => {
        await deployments.fixture(["all"]);
        [owner, addr1] = await ethers.getSigners();
        governor = await ethers.getContract("GovernorContract");
        treasury = await ethers.getContract("Treasury");
        governanceToken = await ethers.getContract("GovernanceToken");
        encodedFunctionCall = treasury.interface.encodeFunctionData(FUNC);
    });

    it("should create proposal", async function () {
        const proposeTx = await governor.propose(
            [treasury.address],
            [0],
            [encodedFunctionCall],
            PROPOSAL_DESCRIPTION
        );
        const proposeReceipt = await proposeTx.wait(1);
        const proposalId = proposeReceipt.events![0].args!.proposalId;

        console.log(`proposal with id(${proposalId}) created`);
    });

    it("should fail create proposal", async function () {
        await expect(
            governor
                .connect(addr1)
                .propose([treasury.address], [0], [encodedFunctionCall], PROPOSAL_DESCRIPTION)
        ).revertedWith("Governor: proposer votes below proposal threshold");
    });

    it("should create proposal after delegated token", async function () {
        console.log(ethers.utils.formatEther(await governanceToken.getVotes(addr1.address)));
        await governanceToken.connect(owner).delegate(addr1.address);
        console.log(ethers.utils.formatEther(await governanceToken.getVotes(addr1.address)));

        const proposeTx = await governor
            .connect(addr1)
            .propose([treasury.address], [0], [encodedFunctionCall], PROPOSAL_DESCRIPTION);
        await proposeTx.wait(1);
    });
});
