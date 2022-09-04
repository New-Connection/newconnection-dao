import {ethers, deployments} from "hardhat";
import {GovernorContract, GovernanceNFT} from "../typechain-types";
import {expect} from "chai";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {PROPOSAL_DESCRIPTION, PROPOSAL_INFO_URI, VOTING_DELAY} from "../helper-hardhat-config";
import {delegate, reserve} from "../utils/governanceNFT-utils";
import { DEBUG } from "../helper-hardhat-config";
import { moveBlocks } from "../utils/move-blocks";

describe("2-1-Propose to Governor", async () => {
    let governor: GovernorContract;
    let governanceNFT: GovernanceNFT;
    let outsideNFT: GovernanceNFT;

    let encodedFunctionCall: string;

    let owner: SignerWithAddress, notOwner: SignerWithAddress;

    beforeEach(async () => {
        await deployments.fixture(["all"]);
        [owner, notOwner] = await ethers.getSigners();
        governor = await ethers.getContract("GovernorContract");
        governanceNFT = await ethers.getContract("GovernanceNFT");
        encodedFunctionCall = governor.interface.encodeFunctionData('incrementExecutedProposals');

        await reserve(governanceNFT, owner, 1);
        await delegate(governanceNFT, owner, owner.address);

        await deployments.fixture(["all", "GovernanceNFT", "fakeNFT"])
        outsideNFT = await ethers.getContract("GovernanceNFT");
        await reserve(outsideNFT, owner, 1);
        await delegate(outsideNFT, owner, owner.address)
    });

    const createProposal = async (signer: SignerWithAddress, tokenAddress: GovernanceNFT): Promise<number> => {
        const proposeTx = await governor
            .connect(signer)
            .propose([governor.address], [0], [encodedFunctionCall], PROPOSAL_DESCRIPTION, tokenAddress.address);
        const proposeReceipt = await proposeTx.wait(1);

        return proposeReceipt.events![0].args!.proposalId;
    };

    it("should create proposal", async function () {
        const proposalId = await createProposal(owner, governanceNFT);

        //0 - Pending
        DEBUG ? console.log(`Proposal with id(${proposalId}) created.`) : ''
        expect(await governor.state(proposalId)).to.equal(0);
    });

    it("[Error] should fail create proporsal, because we don't have this NFT in DAO", async function (){
        await expect(
            governor
                .connect(owner)
                .propose([governor.address], [0], [encodedFunctionCall], PROPOSAL_DESCRIPTION, outsideNFT.address)
        ).revertedWith("GovernorVotes: Address should added into DAO");
    })

    it("[Error] should fail create proposal", async function () {
        await expect(
            governor
                .connect(notOwner)
                .propose([governor.address], [0], [encodedFunctionCall], PROPOSAL_DESCRIPTION, governanceNFT.address)
        ).revertedWith("Governor: proposer votes below proposal threshold");
    });

    it("after add a new NFT into DAO should create proposal", async function () {
        await governor.addToken(outsideNFT.address);
        expect(await governor.getTokensLength()).to.equal(2);
        await moveBlocks(VOTING_DELAY + 1);
        const proposalId = await createProposal(owner, outsideNFT);
        DEBUG ? console.log(`Proposal with id(${proposalId}) created.`) : ''
        expect(await governor.state(proposalId)).to.equal(0);
    })

    it("should create proposal after delegated token", async function () {
        DEBUG ? console.log(
            `Account votes before delegate${ethers.utils.formatEther(
                await governanceNFT.getVotes(notOwner.address)
            )}`
        ) : ''
        await governanceNFT.connect(owner).delegate(notOwner.address);
        DEBUG ?  console.log(
            `Account votes after delegate${ethers.utils.formatEther(
                await governanceNFT.getVotes(notOwner.address)
            )}`
        ) : ''

        const proposalId = await createProposal(notOwner, governanceNFT);

        //0 - Pending
        DEBUG ? console.log(`Proposal with id(${proposalId}) created.`) : ''
        expect(await governor.state(proposalId)).to.equal(0);
    });

    it("should set proposal info URI", async function () {
        const proposalId = await createProposal(owner, governanceNFT);

        const setTx = await governor.setProposalInfoURI(proposalId, PROPOSAL_INFO_URI);
        await setTx.wait(1);

        expect(await governor.proposalInfoURI(proposalId)).equal(PROPOSAL_INFO_URI);
    });

    it("[ERROR] should fail set proposal info URI (NOT PROPOSER)", async function () {
        const proposalId = await createProposal(owner, governanceNFT);

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
