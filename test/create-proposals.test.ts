import { ethers, deployments } from "hardhat";
import { GovernorContract, Treasury, GovernanceToken } from "../typechain-types";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { FUNC, PROPOSAL_DESCRIPTION, PROPOSAL_INFO_URI } from "../helper-hardhat-config";

describe("Propose to Governor", async () => {
    let governor: GovernorContract;
    let treasury: Treasury;
    let governanceToken: GovernanceToken;

    let encodedFunctionCall: string;

    let owner: SignerWithAddress, notOwner: SignerWithAddress;

    beforeEach(async () => {
        await deployments.fixture(["all"]);
        [owner, notOwner] = await ethers.getSigners();
        governor = await ethers.getContract("GovernorContract");
        treasury = await ethers.getContract("Treasury");
        governanceToken = await ethers.getContract("GovernanceToken");
        encodedFunctionCall = treasury.interface.encodeFunctionData(FUNC);
    });

    const createProposal = async (signer: SignerWithAddress): Promise<number> => {
        const proposeTx = await governor
            .connect(signer)
            .propose([treasury.address], [0], [encodedFunctionCall], PROPOSAL_DESCRIPTION);
        const proposeReceipt = await proposeTx.wait(1);

        return proposeReceipt.events![0].args!.proposalId;
    };

    it("should create proposal", async function () {
        const proposalId = await createProposal(owner);

        //0 - Pending
        console.log(`Proposal with id(${proposalId}) created.`);
        expect(await governor.state(proposalId)).to.equal(0);
    });

    it("should fail create proposal", async function () {
        await expect(
            governor
                .connect(notOwner)
                .propose([treasury.address], [0], [encodedFunctionCall], PROPOSAL_DESCRIPTION)
        ).revertedWith("Governor: proposer votes below proposal threshold");
    });

    it("should create proposal after delegated token", async function () {
        console.log(
            `Account votes before delegate${ethers.utils.formatEther(
                await governanceToken.getVotes(notOwner.address)
            )}`
        );
        await governanceToken.connect(owner).delegate(notOwner.address);
        console.log(
            `Account votes after delegate${ethers.utils.formatEther(
                await governanceToken.getVotes(notOwner.address)
            )}`
        );

        const proposalId = await createProposal(notOwner);

        //0 - Pending
        console.log(`Proposal with id(${proposalId}) created.`);
        expect(await governor.state(proposalId)).to.equal(0);
    });

    it("should set proposal info URI", async function () {
        const proposalId = await createProposal(owner);

        const setTx = await governor.setProposalInfoURI(proposalId, PROPOSAL_INFO_URI);
        await setTx.wait(1);

        expect(await governor.proposalInfoURI(proposalId)).equal(PROPOSAL_INFO_URI);
    });

    it("should fail set proposal info URI (NOT PROPOSER)", async function () {
        const proposalId = await createProposal(owner);

        await expect(
            governor.connect(notOwner).setProposalInfoURI(proposalId, PROPOSAL_INFO_URI)
        ).revertedWith("Not proposer");
    });

    it("should fail set not existing proposal", async function () {
        const proposalId = ethers.utils.parseEther("23.33");

        await expect(governor.setProposalInfoURI(proposalId, PROPOSAL_INFO_URI)).revertedWith(
            "Not proposer"
        );
    });
});
