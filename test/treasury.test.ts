import { ethers, deployments } from "hardhat";
import { Treasury } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";

describe("Test treasury functions", async () => {
    let treasury: Treasury;

    let owner: SignerWithAddress, receiver: SignerWithAddress;

    const amountToSend = ethers.utils.parseEther("1");

    beforeEach(async () => {
        await deployments.fixture(["all"]);
        [owner, receiver] = await ethers.getSigners();
        treasury = await ethers.getContract("Treasury");
    });

    it("should increment treasury's counter", async function () {
        const executeTx = await treasury.execute();
        await executeTx.wait(1);

        expect(await treasury.executedProposals()).equal(1);
    });

    it("should send ETH to receiver", async function () {
        await owner.sendTransaction({
            to: treasury.address,
            value: amountToSend,
        });

        const receiverBalanceBeforeSend = await ethers.provider.getBalance(receiver.address);
        const sendTx = await treasury.send(receiver.address, amountToSend);
        await sendTx.wait(1);

        expect(await ethers.provider.getBalance(receiver.address)).equal(
            receiverBalanceBeforeSend.add(amountToSend)
        );
    });

    it("should receive money from fallback function", async function () {
        const data = ethers.utils.id("data");
        await owner.sendTransaction({
            to: treasury.address,
            value: amountToSend,
            data: data,
        });

        expect(await ethers.provider.getBalance(treasury.address)).equal(amountToSend);
    });

    it("should fail send ETH to receiver", async function () {
        await expect(treasury.send(receiver.address, amountToSend)).revertedWith("Not enough ETH");
    });
});
