import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
    VOTING_PERIOD,
    QUORUM_PERCENTAGE,
    GOVERNOR_NAME,
} from "../helper-hardhat-config";

const deployGovernorContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments } = hre;
    const { deploy, get } = deployments;
    const { deployer } = await getNamedAccounts();
    const governanceNFT = await get("GovernanceNFT");

    await deploy("GovernorContract", {
        from: deployer,
        args: [
            GOVERNOR_NAME,
            governanceNFT.address,
            VOTING_PERIOD,
            QUORUM_PERCENTAGE,
        ],
        log: true,
    });
};

export default deployGovernorContract;
deployGovernorContract.tags = ["all", "GovernorContract"];
