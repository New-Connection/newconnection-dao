import { ethers, deployments } from "hardhat";
import { GovernanceNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { setAllowList, reserve, mint } from "../utils/governanceNFT-utils";
import { NFT_BASE_URI, NFT_SUPPLY } from "../helper-hardhat-config";

describe("Test treasury functions", async () => {
    let governanceNFT: GovernanceNFT;

    let owner: SignerWithAddress, notOwner: SignerWithAddress, minter: SignerWithAddress;

    const numAllowedToMint = 5;

    beforeEach(async () => {
        await deployments.fixture(["all"]);
        [owner, notOwner, minter] = await ethers.getSigners();
        governanceNFT = await ethers.getContract("GovernanceNFT");
    });

    it("should reserve tokens by owner", async function () {
        const tokenAmount = 10;

        const reserveTx = await governanceNFT.connect(owner).reserve(tokenAmount);
        await reserveTx.wait(1);

        expect(await governanceNFT.balanceOf(owner.address)).equal(tokenAmount);
    });

    it("should fail to reserve tokens (not owner)", async function () {
        const tokenAmount = 10;

        await expect(governanceNFT.connect(notOwner).reserve(tokenAmount)).revertedWith(
            "Ownable: caller is not the owner"
        );
    });

    it("should set allow list by owner", async function () {
        const setTx = await governanceNFT
            .connect(owner)
            .setAllowList([minter.address], numAllowedToMint);
        await setTx.wait(1);

        expect(await governanceNFT.numAvailableToMint(minter.address)).equal(numAllowedToMint);
    });

    it("should fail set allow list (not owner)", async function () {
        await expect(setAllowList(notOwner, [minter.address], numAllowedToMint)).revertedWith(
            "Ownable: caller is not the owner"
        );
    });

    it("should mint token", async function () {
        await setAllowList(owner, [minter.address], numAllowedToMint);

        const mintTx = await governanceNFT.connect(minter).mint();
        await mintTx.wait(1);

        expect(await governanceNFT.balanceOf(minter.address)).equal(1);
    });

    it("should mint all allowed tokens", async function () {
        await setAllowList(owner, [minter.address], numAllowedToMint);

        for (let i = 1; i <= numAllowedToMint; i++) {
            const mintTx = await governanceNFT.connect(minter).mint();
            await mintTx.wait(1);
        }

        expect(await governanceNFT.balanceOf(minter.address)).equal(numAllowedToMint);
    });

    it("should should fail after minted allowed tokens", async function () {
        await setAllowList(owner, [minter.address], numAllowedToMint);

        for (let i = 1; i <= numAllowedToMint; i++) {
            const mintTx = await governanceNFT.connect(minter).mint();
            await mintTx.wait(1);
        }

        await expect(governanceNFT.connect(minter).mint()).revertedWith(
            "Exceeded max available to mint"
        );
    });

    it("should fail mint (not in allow list)", async function () {
        await expect(governanceNFT.connect(minter).mint()).revertedWith(
            "Exceeded max available to mint"
        );
    });

    it("should fail mint after maxSupply tokens minted", async function () {
        await reserve(owner, NFT_SUPPLY);

        await setAllowList(owner, [minter.address], numAllowedToMint);

        await expect(governanceNFT.connect(minter).mint()).revertedWith("Exceeded max supply");
    });

    it("should set base URI", async function () {
        const setTx = await governanceNFT.setBaseURI(NFT_BASE_URI);
        await setTx.wait(1);

        await setAllowList(owner, [minter.address], numAllowedToMint);

        await mint(minter);

        const lastMintedTokenId = (await governanceNFT.totalSupply()).sub(1);

        expect(await governanceNFT.tokenURI(lastMintedTokenId)).equal(
            NFT_BASE_URI + lastMintedTokenId
        );
    });
});
