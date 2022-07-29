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

describe("Propose to Governor", async () => {
    let governor: GovernorContract;
    let governanceNFT: GovernanceNFT;

    let owner: SignerWithAddress, notOwner: SignerWithAddress;

    before(async () => {
        await deployments.fixture(["all"]);
        [owner, notOwner] = await ethers.getSigners();
        governor = await ethers.getContract("GovernorContract");
        governanceNFT = await ethers.getContract("GovernanceNFT");

        await reserve(owner, 1);
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

    it("should return governance token address", async function () {
        expect(await governor.token()).equal(governanceNFT.address);
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
