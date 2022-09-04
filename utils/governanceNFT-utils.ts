import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { NFT_PRICE } from "../helper-hardhat-config";

export const reserve = async (_governanceNFT: any, signer: SignerWithAddress, numberOfTokens: number) => {
    const governanceNFT = _governanceNFT;

    const reserveTx = await governanceNFT.connect(signer).reserve(numberOfTokens);
    await reserveTx.wait(1);
};

export const delegate = async (_governanceNFT: any, signer: SignerWithAddress, delegatedAccount: string) => {
    const governanceNFT = _governanceNFT;

    const delegateTx = await governanceNFT.connect(signer).delegate(delegatedAccount);
    await delegateTx.wait(1);
};

export const transferNFT = async (
    _governanceNFT: any,
    signer: SignerWithAddress,
    to: string,
    numberOfTokens: number
) => {
    const governanceNFT = _governanceNFT;

    for (let i = 0; i < numberOfTokens; i++) {
        const tokenId = await governanceNFT.tokenOfOwnerByIndex(signer.address, 0);
        await governanceNFT.connect(signer).transferFrom(signer.address, to, tokenId);
    }
};

export const setAllowList = async (
    _governanceNFT: any,
    signer: SignerWithAddress,
    addresses: string[],
    numAllowedToMint: number
) => {
    const governanceNFT = _governanceNFT;

    const setTx = await governanceNFT.connect(signer).setAllowList(addresses, numAllowedToMint);
    await setTx.wait(1);
};

export const mint = async (_governanceNFT: any, signer: SignerWithAddress) => {
    const pricePerToken = ethers.utils.parseEther(NFT_PRICE);

    const governanceNFT = _governanceNFT;

    const mintTx = await governanceNFT.connect(signer).mint({ value: pricePerToken });
    await mintTx.wait(1);
};
