import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const deployGovernanceToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    log("Deploying governance token...");
    const governanceToken = await deploy("GovernanceToken", {
        from: deployer,
        args: [],
        log: true,
    });

    await delegate(governanceToken.address, deployer);
    log("Delegated");
};

const delegate = async (governanceTokenAddress: string, delegatedAccount: string) => {
    const governanceToken = await ethers.getContractAt("GovernanceToken", governanceTokenAddress);
    const tx = await governanceToken.delegate(delegatedAccount);
    await tx.wait(1);
    // console.log(`Checkpoints ${await governanceToken.numCheckpoints(delegatedAccount)}`);
    // console.log(ethers.utils.formatEther(await governanceToken.balanceOf(delegatedAccount)));
};

export default deployGovernanceToken;
deployGovernanceToken.tags = ["all", "GovernanceToken"];
