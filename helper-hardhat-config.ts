import { ethers } from "hardhat";

export const MIN_DELAY = 3600;
export const VOTING_PERIOD = 5;
export const VOTING_DELAY = 1;
export const QUORUM_PERCENTAGE = 4;
export const PROPOSAL_THRESHOLD = ethers.utils.parseEther("1000");
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export const NEW_STORE_VALUE = 77;
export const FUNC = "execute";
export const PROPOSAL_DESCRIPTION = "Proposal #1: execute";
export const TOKEN_NAME = "Governor Token";
export const TOKEN_SYMBOL = "GT";
export const GOVERNOR_NAME = "Governor Contract";
export const GOVERNOR_INFO_URI = "ipfs://QmeqfJkfCfgFgddkWvHocHpSxC1K3sfFNfribqmZ7WYB2";
export const PROPOSAL_INFO_URI = "ipfs://ZdfSDfsfgFgddkWvHocHpSxC1K3sfFNfribqdf3dDDF35/proposals/0";

export const developmentChains = ["hardhat", "localhost"];
export const proposalsFiles = "proposals.json";
