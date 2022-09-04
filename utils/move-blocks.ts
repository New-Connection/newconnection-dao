import { network } from "hardhat";
import {
    DEBUG_BLOCKS
} from "../helper-hardhat-config";

export async function moveBlocks(amount: number) {
    DEBUG_BLOCKS ? console.log(`Moving ${amount} blocks`) : '';

    for (let i = 0; i < amount; i++) {
        await network.provider.request({
            method: "evm_mine",
            params: [],
        });
    }
}
