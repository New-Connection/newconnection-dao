import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export const unpause = async (signer: SignerWithAddress) => {
    const governanceNFT = await ethers.getContract("GovernanceNFT");

    const unpauseTX = await governanceNFT.connect(signer).unpause();
    await unpauseTX.wait(1);
};
export const reserve = async (signer: SignerWithAddress, numberOfTokens: number) => {
    const governanceNFT = await ethers.getContract("GovernanceNFT");

    const reserveTx = await governanceNFT.connect(signer).reserve(numberOfTokens);
    await reserveTx.wait(1);
};

export const delegate = async (signer: SignerWithAddress, delegatedAccount: string) => {
    const governanceNFT = await ethers.getContract("GovernanceNFT");

    const delegateTx = await governanceNFT.connect(signer).delegate(delegatedAccount);
    await delegateTx.wait(1);
};

export const transferNFT = async (
    signer: SignerWithAddress,
    to: string,
    numberOfTokens: number
) => {
    const governanceNFT = await ethers.getContract("GovernanceNFT");

    for (let i = 0; i < numberOfTokens; i++) {
        const tokenId = await governanceNFT.tokenOfOwnerByIndex(signer.address, 0);
        await governanceNFT.connect(signer).transferFrom(signer.address, to, tokenId);
    }
};
