import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployTreasury: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("Treasury", {
    from: deployer,
    args: [],
    log: true,
  });
};

export default deployTreasury;
deployTreasury.tags = ["all", "Treasury"];
