import { network } from "hardhat";

export async function moveBlocks(amount: number) {
    console.log(`Moving ${amount} blocks`);

    for (let i = 0; i < amount; i++) {
        await network.provider.request({
            method: "evm_mine",
            params: [],
        });
    }
}
