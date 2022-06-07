import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
    VOTING_PERIOD,
    VOTING_DELAY,
    QUORUM_PERCENTAGE,
    PROPOSAL_THRESHOLD,
    GOVERNOR_NAME,
    GOVERNOR_INFO_URI,
} from "../helper-hardhat-config";

const deployGovernorContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments } = hre;
    const { deploy, log, get } = deployments;
    const { deployer } = await getNamedAccounts();
    const governanceToken = await get("GovernanceToken");

    log("Deploying governor");

    const governorContract = await deploy("GovernorContract", {
        from: deployer,
        args: [
            GOVERNOR_NAME,
            GOVERNOR_INFO_URI,
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
