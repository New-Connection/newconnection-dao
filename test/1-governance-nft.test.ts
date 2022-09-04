import { ethers, deployments } from "hardhat";
import { GovernanceNFT } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { setAllowList, reserve, mint } from "../utils/governanceNFT-utils";
import { NFT_BASE_URI, NFT_PRICE } from "../helper-hardhat-config";
import ONFT_ARGS from "../constants/onftArgs.json";

describe("1-Test NFT contract functions", async () => {
    let governanceNFT: GovernanceNFT;

    let owner: SignerWithAddress, notOwner: SignerWithAddress, minter: SignerWithAddress;

    const numAllowedToMint = 5;
    const pricePerToken = ethers.utils.parseEther(NFT_PRICE);

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
        await expect(setAllowList(governanceNFT, notOwner, [minter.address], numAllowedToMint)).revertedWith(
            "Ownable: caller is not the owner"
        );
    });

    it("should mint token", async function () {
        await setAllowList(governanceNFT, owner, [minter.address], numAllowedToMint);

        const mintTx = await governanceNFT.connect(minter).mint({ value: pricePerToken });
        await mintTx.wait(1);

        expect(await governanceNFT.balanceOf(minter.address)).equal(1);
    });

    it("should mint all allowed tokens", async function () {
        await setAllowList(governanceNFT, owner, [minter.address], numAllowedToMint);

        for (let i = 1; i <= numAllowedToMint; i++) {
            const mintTx = await governanceNFT.connect(minter).mint({ value: pricePerToken });
            await mintTx.wait(1);
        }

        expect(await governanceNFT.balanceOf(minter.address)).equal(numAllowedToMint);
    });

    it("should should fail after minted allowed tokens", async function () {
        await setAllowList(governanceNFT, owner, [minter.address], numAllowedToMint);

        for (let i = 1; i <= numAllowedToMint; i++) {
            const mintTx = await governanceNFT.connect(minter).mint({ value: pricePerToken });
            await mintTx.wait(1);
        }

        await expect(governanceNFT.connect(minter).mint({ value: pricePerToken })).revertedWith(
            "Exceeded max available to mint"
        );
    });

    it("should fail mint (not in allow list)", async function () {
        await expect(governanceNFT.connect(minter).mint({ value: pricePerToken })).revertedWith(
            "Exceeded max available to mint"
        );
    });

    it("should fail mint after maxSupply tokens minted", async function () {
        const supply = ONFT_ARGS["hardhat"].endMintId - ONFT_ARGS["hardhat"].startMintId + 1;

        await reserve(governanceNFT, owner, supply);
        await setAllowList(governanceNFT, owner, [minter.address], numAllowedToMint);
        await expect(governanceNFT.connect(minter).mint()).revertedWith("Max mint limit reached");
    });

    it("should set base URI", async function () {
        const setTx = await governanceNFT.setBaseURI(NFT_BASE_URI);
        await setTx.wait(1);

        await setAllowList(governanceNFT, owner, [minter.address], numAllowedToMint);

        await mint(governanceNFT, minter);

        const lastMintedTokenId = (await governanceNFT.nextMintId()).sub(1);

        expect(await governanceNFT.tokenURI(lastMintedTokenId)).equal(NFT_BASE_URI);
    });

    it("should withdraw balance by owner", async function () {
        await setAllowList(governanceNFT, owner, [minter.address], numAllowedToMint);
        await mint(governanceNFT, minter);

        const contractBalanceBefore = await ethers.provider.getBalance(governanceNFT.address);
        expect(contractBalanceBefore).equal(pricePerToken);

        const balanceBefore = await ethers.provider.getBalance(owner.address);
        const withdrawTx = await governanceNFT.connect(owner).withdraw();
        await withdrawTx.wait(1);

        const balanceAfter = await ethers.provider.getBalance(owner.address);
        expect(balanceBefore.add(pricePerToken)).gte(balanceAfter);

        const contractBalanceAfter = await ethers.provider.getBalance(governanceNFT.address);
        expect(contractBalanceAfter).equal(0);
    });

    it("should fail withdraw by NOT owner ", async function () {
        await setAllowList(governanceNFT, owner, [minter.address], numAllowedToMint);
        await mint(governanceNFT, minter);

        const contractBalanceBefore = await ethers.provider.getBalance(governanceNFT.address);
        expect(contractBalanceBefore).equal(pricePerToken);

        await expect(governanceNFT.connect(notOwner).withdraw()).revertedWith(
            "Ownable: caller is not the owner"
        );

        const contractBalanceAfter = await ethers.provider.getBalance(governanceNFT.address);
        expect(contractBalanceAfter).equal(pricePerToken);
    });
});
