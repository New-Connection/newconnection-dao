import { DeployFunction } from "hardhat-deploy/types";
import { NFT_NAME, NFT_PRICE, NFT_SYMBOL } from "../helper-hardhat-config";
import LZ_ENDPOINTS from "../constants/layerzeroEndpoints.json";
import ONFT_ARGS from "../constants/onftArgs.json";
import { ethers } from "hardhat";

const deployFakeGovernanceToken: DeployFunction = async function (hre) {
    const { deploy } = hre.deployments;
    const { notOwner } = await hre.getNamedAccounts();

    // @ts-ignore
    const lzEndpointAddress = LZ_ENDPOINTS[hre.network.name];
    // @ts-ignore
    const onftArgs = ONFT_ARGS[hre.network.name];

    await deploy("GovernanceNFT", {
        from: notOwner,
        args: [
            "FAKENFT",
            NFT_SYMBOL,
            ethers.utils.parseEther(NFT_PRICE),
            lzEndpointAddress,
            onftArgs.startMintId,
            onftArgs.endMintId,
        ],
        log: true,
    });
};

export default deployFakeGovernanceToken;
deployFakeGovernanceToken.tags = ["all", "GovernanceNFT", "fakeNFT"];
