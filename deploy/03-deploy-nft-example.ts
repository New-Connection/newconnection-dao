import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployNFTExample: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    log("Deploying NFT example");

    const nftExample = await deploy("NFTExample", {
        from: deployer,
        args: [],
        log: true,
    });
};

export default deployNFTExample;
