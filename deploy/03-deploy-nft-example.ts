import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { NFT_NAME, NFT_SYMBOL } from "../helper-hardhat-config";

const deployNFTExample: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    await deploy("GovernanceNFT", {
        from: deployer,
        args: [NFT_NAME, NFT_SYMBOL],
        log: true,
    });
};

export default deployNFTExample;
deployNFTExample.tags = ["all", "NFTExample"];
