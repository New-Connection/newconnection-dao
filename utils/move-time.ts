import { network } from "hardhat";
import {
    DEBUG_BLOCKS
} from "../helper-hardhat-config";

export async function moveTime(amount: number) {
    DEBUG_BLOCKS ? console.log("Moving time...") : ''
    await network.provider.send("evm_increaseTime", [amount]);
    DEBUG_BLOCKS ? console.log(`Moved forward ${amount} seconds`) : ''
}
