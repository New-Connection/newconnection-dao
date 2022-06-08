import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
    VOTING_PERIOD,
    VOTING_DELAY,
    QUORUM_PERCENTAGE,
    PROPOSAL_THRESHOLD,
    GOVERNOR_NAME,
} from "../helper-hardhat-config";

const deployGovernorContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments } = hre;
    const { deploy, get } = deployments;
    const { deployer } = await getNamedAccounts();
    const governanceToken = await get("GovernanceToken");

    await deploy("GovernorContract", {
        from: deployer,
        args: [
            GOVERNOR_NAME,
            governanceToken.address,
            VOTING_DELAY,
            VOTING_PERIOD,
            PROPOSAL_THRESHOLD,
            QUORUM_PERCENTAGE,
        ],
        log: true,
    });
};

export default deployGovernorContract;
deployGovernorContract.tags = ["all", "GovernorContract"];
