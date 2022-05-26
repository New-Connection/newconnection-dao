import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import {
    VOTING_PERIOD,
    VOTING_DELAY,
    QUORUM_PERCENTAGE,
    PROPOSAL_THRESHOLD,
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
