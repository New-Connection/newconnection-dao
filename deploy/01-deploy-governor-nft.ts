import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { NFT_NAME, NFT_SUPPLY, NFT_SYMBOL } from "../helper-hardhat-config";

const deployGovernanceToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const governanceNFT = await deploy("GovernanceNFT", {
        from: deployer,
        args: [NFT_NAME, NFT_SYMBOL, NFT_SUPPLY ],
        log: true,
    });
};

export default deployGovernanceToken;
deployGovernanceToken.tags = ["all", "GovernanceNFT"];
