import { expect } from "chai";
import { ADDRESS_ZERO } from "../helper-hardhat-config";

// Loading delpoy functions
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployFixture } from "../utils/helpers-for-test";


describe("0-0-GovernorContract", function () {
  describe('Check dao', function () {
    it('Should be version 2.0', async function(){
      const { GovernorContract } = await loadFixture(deployFixture);
      const version = await GovernorContract.version()
      expect(version).to.eq('2.0')
    })
  })

  describe("Check implementation of DAO", function () {
    it('Should be one initital NFT', async function() {
      const { GovernorContract } = await loadFixture(deployFixture);
      const numberOfNFT = await GovernorContract.getTokensLength()
      expect(numberOfNFT).to.eq(1)
    })

    it("[ERROR] Add same address", async function() {
      const { GovernorContract, GovernanceNFT } = await loadFixture(deployFixture);
      await expect(
        GovernorContract.addToken(GovernanceNFT.address)).to.be.revertedWith(
          "GovernorVotes: This address is already exist");
    })

    it("Add zero address", async function() {
      const { GovernorContract } = await loadFixture(deployFixture);
      await expect(GovernorContract.addToken(ADDRESS_ZERO)).to.be.revertedWith(
          "Address should non-zero"
      );
    })

    it('Should add NFT token', async function() {
      const { GovernorContract, GovernanceNFT, FakeNFT } = await loadFixture(deployFixture);
      expect(GovernanceNFT).not.to.be.eq(FakeNFT)
      await GovernorContract.addToken(FakeNFT.address)
      const numberOfNFT = await GovernorContract.getTokensLength()
      expect(numberOfNFT).to.eq(2)
    })
 });
})
