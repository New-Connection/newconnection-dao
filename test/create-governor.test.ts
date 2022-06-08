import { ethers, deployments } from "hardhat";
import { GovernorContract, GovernanceToken } from "../typechain-types";
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

describe("Propose to Governor", async () => {
    let governor: GovernorContract;
    let governanceToken: GovernanceToken;

    let owner: SignerWithAddress, notOwner: SignerWithAddress;

    beforeEach(async () => {
        await deployments.fixture(["all"]);
        [owner, notOwner] = await ethers.getSigners();
        governor = await ethers.getContract("GovernorContract");
        governanceToken = await ethers.getContract("GovernanceToken");
    });

    it("should return governor name", async function () {
        expect(await governor.name()).equal(GOVERNOR_NAME);
    });

    it("should return governor infoURI", async function () {
        expect(await governor.infoURI()).equal(GOVERNOR_INFO_URI);
    });

    it("should set new governor infoURI", async function () {
        const newInfoURI = "NEW URI";

        const setTx = await governor.setInfoURI(newInfoURI);
        await setTx.wait(1);

        expect(await governor.infoURI()).equal(newInfoURI);
    });

    it("should fail set new governor infoURI (NOT OWNER)", async function () {
        const newInfoURI = "NEW URI";

        await expect(governor.connect(notOwner).setInfoURI(newInfoURI)).revertedWith(
            "Ownable: caller is not the owner"
        );
    });

    it("should return governance token address", async function () {
        expect(await governor.token()).equal(governanceToken.address);
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
        expect(await governor.quorumNumerator()).equal(QUORUM_PERCENTAGE);
    });
});
