import { ethers, deployments } from "hardhat";
import { GovernorContract, GovernanceNFT } from "../typechain-types";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
    GOVERNOR_INFO_URI,
    GOVERNOR_NAME,
    PROPOSAL_THRESHOLD,
    QUORUM_PERCENTAGE,
    VOTING_DELAY,
    VOTING_PERIOD,
} from "../helper-hardhat-config";
import { reserve } from "../utils/governanceNFT-utils";

describe("2-0-Propose to Governor", async () => {
    let governor: GovernorContract;
    let governanceNFT: GovernanceNFT;
    let outsideNFT: GovernanceNFT;

    let owner: SignerWithAddress, notOwner: SignerWithAddress;

    before(async () => {
        await deployments.fixture(["all"]);
        [owner, notOwner] = await ethers.getSigners();
        governor = await ethers.getContract("GovernorContract");
        governanceNFT = await ethers.getContract("GovernanceNFT");
        await reserve(governanceNFT, owner, 1);

        await deployments.fixture(["all", "GovernanceNFT", "fakeNFT"])
        outsideNFT = await ethers.getContract("GovernanceNFT");
        await reserve(outsideNFT, owner, 1);
    });

    it("should return governor name", async function () {
        expect(await governor.name()).equal(GOVERNOR_NAME);
    });

    it("should return governor infoURI (empty initially)", async function () {
        expect(await governor.governorInfoURI()).equal("");
    });

    it("should set new governor infoURI", async function () {
        const setTx = await governor.setGovernorInfoURI(GOVERNOR_INFO_URI);
        await setTx.wait(1);

        expect(await governor.governorInfoURI()).equal(GOVERNOR_INFO_URI);
    });

    it("should fail set new governor infoURI (NOT OWNER)", async function () {
        await expect(governor.connect(notOwner).setGovernorInfoURI(GOVERNOR_INFO_URI)).revertedWith(
            "Ownable: caller is not the owner"
        );
    });

    describe("Multi tokens manipulation", async function () {
        it('check initial lenght of DAO tokens', async function () {
            expect(await governor.getTokensLength()).equal(1)
        })
        
        it('[ERROR] should fail if set a new from not owner address', async function () {
            await expect(governor.connect(notOwner).addToken(outsideNFT.address)).revertedWith(
                "Ownable: caller is not the owner"
            );
        })
        
        it('add new token address into DAO', async function () {
            await governor.connect(owner).addToken(outsideNFT.address)
            expect(await governor.getTokensLength()).equal(2)
        })
        
        it('[ERROR] add initial NFT address into DAO', async function() {
            expect(await governor.getTokensLength()).equal(2)
            await expect(governor.connect(owner).addToken(governanceNFT.address)).revertedWith(
                "GovernorVotes: This address is already exist"
            );
        })

        it('[ERROR] add same address into DAO', async function() {
            expect(await governor.getTokensLength()).equal(2)
            await expect(governor.connect(owner).addToken(outsideNFT.address)).revertedWith(
                "GovernorVotes: This address is already exist"
            );
        })
    })

    it("should return initial governance token address", async function () {
        expect(await governor.token(0)).equal(governanceNFT.address);
    });

    it("should return voting delay", async function () {
        expect(await governor.votingDelay()).equal(VOTING_DELAY);
    });

    it("should return voting period", async function () {
        expect(await governor.votingPeriod()).equal(VOTING_PERIOD);
    });

    it("should return voting proposal threshold", async function () {
        expect(await governor.proposalThreshold()).equal(PROPOSAL_THRESHOLD);
    });

    it("should return quorum percentage", async function () {
        expect(await governor["quorumNumerator()"]()).equal(QUORUM_PERCENTAGE);
    });
});
