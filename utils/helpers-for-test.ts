import LZ_ENDPOINTS from "../constants/layerzeroEndpoints.json";
import ONFT_ARGS from "../constants/onftArgs.json";
import {ethers, deployments} from "hardhat";
import {GovernanceNFT, GovernorContract} from "../typechain-types"
import { NFT_NAME, NFT_PRICE, NFT_SYMBOL, VOTING_PERIOD,
    QUORUM_PERCENTAGE,
    GOVERNOR_NAME,ADDRESS_ZERO } from "../helper-hardhat-config";


export async function deployFixture(){
    const [owner, addr1, addr2] = await ethers.getSigners();

    // @ts-ignore
    const lzEndpointAddress = LZ_ENDPOINTS[hre.network.name];
    // @ts-ignore
    const onftArgs = ONFT_ARGS[hre.network.name];
    
    const _governanceNFT = await ethers.getContractFactory("GovernanceNFT", owner);
    const GovernanceNFT = await _governanceNFT.deploy(NFT_NAME, NFT_SYMBOL, ethers.utils.parseEther(NFT_PRICE),lzEndpointAddress,
        onftArgs.startMintId,onftArgs.endMintId,);
    await GovernanceNFT.deployed();
    
    const _governorContract = await ethers.getContractFactory("GovernorContract", owner);
    const GovernorContract = await _governorContract.deploy(GOVERNOR_NAME, GovernanceNFT.address,VOTING_PERIOD, QUORUM_PERCENTAGE);
    await GovernorContract.deployed();


    const _fakeNFT = await ethers.getContractFactory("GovernanceNFT", addr1);
    const FakeNFT = await _fakeNFT.deploy(NFT_NAME, NFT_SYMBOL, ethers.utils.parseEther(NFT_PRICE),lzEndpointAddress,
        onftArgs.startMintId,onftArgs.endMintId,);
    await FakeNFT.deployed();

    return {GovernanceNFT, GovernorContract, FakeNFT, owner, addr1, addr2}
  }