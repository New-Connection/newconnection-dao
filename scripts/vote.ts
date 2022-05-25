import { developmentChains, proposalsFiles, VOTING_PERIOD } from "../helper-hardhat-config";
import { ethers, network } from "hardhat";
import { moveBlocks } from "../utils/move-blocks";
import * as fs from "fs";

async function main(proposalIndex: number) {
    const proposals = JSON.parse(fs.readFileSync(proposalsFiles, "utf8"));
    const proposalId = proposals[network.config.chainId!][proposalIndex];

    // 0 - againts, 1 - for, 2 - abstain
    const voteWay = 1;
    const governor = await ethers.getContract("GovernorContract");
    const reason = " I like it";
    const voteTxResponse = await governor.castVoteWithReason(proposalId, voteWay, reason);
    await voteTxResponse.wait(1);

    if (developmentChains.includes(network.name)) {
        await moveBlocks(VOTING_PERIOD + 1);
    }
    console.log("Voted");
}

const index = 0;

main(index)
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
