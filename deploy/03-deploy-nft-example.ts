import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployNFTExample: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    await deploy("NFTExample", {
        from: deployer,
        args: [],
        log: true,
    });
};

export default deployNFTExample;
deployNFTExample.tags = ["all", "NFTExample"];
