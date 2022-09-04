import { DeployFunction } from "hardhat-deploy/types";
import { NFT_NAME, NFT_PRICE, NFT_SYMBOL } from "../helper-hardhat-config";
import LZ_ENDPOINTS from "../constants/layerzeroEndpoints.json";
import ONFT_ARGS from "../constants/onftArgs.json";
import { ethers } from "hardhat";

const deployGovernanceToken: DeployFunction = async function (hre) {
    const { deploy } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();

    // @ts-ignore
    const lzEndpointAddress = LZ_ENDPOINTS[hre.network.name];
    // @ts-ignore
    const onftArgs = ONFT_ARGS[hre.network.name];

    await deploy("GovernanceNFT", {
        from: deployer,
        args: [
            NFT_NAME,
            NFT_SYMBOL,
            ethers.utils.parseEther(NFT_PRICE),
            lzEndpointAddress,
            onftArgs.startMintId,
            onftArgs.endMintId,
        ],
        log: true,
    });
};

export default deployGovernanceToken;
deployGovernanceToken.tags = ["all", "GovernanceNFT", "NFT2"];
