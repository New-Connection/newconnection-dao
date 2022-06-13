import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { NFT_NAME, NFT_SYMBOL } from "../helper-hardhat-config";

const deployGovernanceToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { getNamedAccounts, deployments } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    const governanceNFT = await deploy("GovernanceNFT", {
        from: deployer,
        args: [NFT_NAME, NFT_SYMBOL],
        log: true,
    });
    await unpause(governanceNFT.address);

    await mint(governanceNFT.address, 10);
    log("Minted");

    await delegate(governanceNFT.address, deployer);
    log("Delegated");
};
const unpause = async (governanceNftAddress: string) => {
    const governanceNFT = await ethers.getContractAt("GovernanceNFT", governanceNftAddress);

    const unpauseTX = await governanceNFT.unpause();
    await unpauseTX.wait(1);
};
const mint = async (governanceNftAddress: string, numberOfTokens: number) => {
    const governanceNFT = await ethers.getContractAt("GovernanceNFT", governanceNftAddress);

    const reserveTx = await governanceNFT.reserve(numberOfTokens);
    await reserveTx.wait(1);
};

const delegate = async (governanceNftAddress: string, delegatedAccount: string) => {
    const governanceNFT = await ethers.getContractAt("GovernanceNFT", governanceNftAddress);

    const delegateTx = await governanceNFT.delegate(delegatedAccount);
    await delegateTx.wait(1);
};

export default deployGovernanceToken;
deployGovernanceToken.tags = ["all", "GovernanceNFT"];
