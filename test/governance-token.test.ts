import { ethers, deployments } from "hardhat";
import { GovernanceToken } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";

describe("Test treasury functions", async () => {
    let governanceToken: GovernanceToken;

    let owner: SignerWithAddress, notOwner1: SignerWithAddress, notOwner2: SignerWithAddress;

    const amountToClaim = ethers.utils.parseUnits("1000", 18);

    beforeEach(async () => {
        await deployments.fixture(["all"]);
        [owner, notOwner1, notOwner2] = await ethers.getSigners();
        governanceToken = await ethers.getContract("GovernanceToken");
    });

    it("should set amount to claim", async function () {
        const setTx = await governanceToken
            .connect(owner)
            .setClaimList([notOwner1.address, notOwner2.address], amountToClaim);
        await setTx.wait(1);

        expect(await governanceToken.amountAvailableToClaim(notOwner1.address)).equal(
            amountToClaim
        );
        expect(await governanceToken.amountAvailableToClaim(notOwner2.address)).equal(
            amountToClaim
        );
    });

    it("should claim tokens", async function () {
        const balanceBeforeClaim = await governanceToken.balanceOf(notOwner1.address);

        const setTx = await governanceToken
            .connect(owner)
            .setClaimList([notOwner1.address], amountToClaim);
        await setTx.wait(1);

        const claimTx = await governanceToken.connect(notOwner1).claim(amountToClaim);
        await claimTx.wait(1);

        expect(await governanceToken.balanceOf(notOwner1.address)).equal(
            balanceBeforeClaim.add(amountToClaim)
        );
    });

    it("should fail claim more than available claim tokens", async function () {
        const setTx = await governanceToken
            .connect(owner)
            .setClaimList([notOwner1.address], amountToClaim);
        await setTx.wait(1);

        await expect(governanceToken.connect(notOwner1).claim(amountToClaim.add(1))).revertedWith(
            "Exceeded max available to claim"
        );
    });

    it("should claim available tokens in few transactions", async function () {
        const balanceBeforeClaim = await governanceToken.balanceOf(notOwner1.address);

        const setTx = await governanceToken
            .connect(owner)
            .setClaimList([notOwner1.address], amountToClaim);
        await setTx.wait(1);

        let claimTx = await governanceToken.connect(notOwner1).claim(amountToClaim.div(2));
        await claimTx.wait(1);
        claimTx = await governanceToken.connect(notOwner1).claim(amountToClaim.div(2));
        await claimTx.wait(1);

        expect(await governanceToken.balanceOf(notOwner1.address)).equal(
            balanceBeforeClaim.add(amountToClaim)
        );
    });

    it("should fail to claim tokens (not in claimList)", async function () {
        await expect(governanceToken.connect(notOwner2).claim(100)).revertedWith(
            "Exceeded max available to claim"
        );
    });
});
