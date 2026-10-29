import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("UniversityRegistry", function () {
  let registry: any;
  let admin: any, uni1: any, uni2: any, stranger: any;

  const FSS = "fss";
  const ENIS = "enis";

  beforeEach(async function () {
    [admin, uni1, uni2, stranger] = await ethers.getSigners();
    registry = await ethers.deployContract("UniversityRegistry");
  });

  describe("access control", function () {
    it("sets the deployer as admin", async function () {
      expect(await registry.admin()).to.equal(admin.address);
    });

    it("lets the admin add a university and emits an event", async function () {
      await expect(registry.addUniversity(FSS, uni1.address))
        .to.emit(registry, "UniversityAdded")
        .withArgs(FSS, uni1.address);
    });

    it("rejects addUniversity from a non-admin", async function () {
      await expect(
        registry.connect(stranger).addUniversity(FSS, uni1.address)
      ).to.be.revertedWith("Only admin can perform this action");
    });

    it("rejects revokeUniversity from a non-admin", async function () {
      await registry.addUniversity(FSS, uni1.address);
      await expect(
        registry.connect(stranger).revokeUniversity(FSS)
      ).to.be.revertedWith("Only admin can perform this action");
    });
  });

  describe("input validation and duplicates", function () {
    it("rejects an empty university name", async function () {
      await expect(registry.addUniversity("", uni1.address))
        .to.be.revertedWith("Name cannot be empty");
    });

    it("rejects the zero wallet address", async function () {
      await expect(registry.addUniversity(FSS, ethers.ZeroAddress))
        .to.be.revertedWith("Invalid wallet address");
    });

    it("rejects a duplicate university name", async function () {
      await registry.addUniversity(FSS, uni1.address);
      await expect(registry.addUniversity(FSS, uni2.address))
        .to.be.revertedWith("University already exists");
    });

    it("rejects a duplicate wallet", async function () {
      await registry.addUniversity(FSS, uni1.address);
      await expect(registry.addUniversity(ENIS, uni1.address))
        .to.be.revertedWith("Wallet already registered");
    });
  });

  describe("revocation", function () {
    it("revokes a university and emits an event", async function () {
      await registry.addUniversity(FSS, uni1.address);
      await expect(registry.revokeUniversity(FSS))
        .to.emit(registry, "UniversityRevoked")
        .withArgs(FSS, uni1.address);

      const [wallet, active, exists] = await registry.getUniversityAddress(FSS);
      expect(wallet).to.equal(uni1.address);
      expect(active).to.equal(false);
      expect(exists).to.equal(true);
    });

    it("rejects revoking an unknown university", async function () {
      await expect(registry.revokeUniversity(FSS))
        .to.be.revertedWith("University does not exist");
    });

    it("rejects revoking an already revoked university", async function () {
      await registry.addUniversity(FSS, uni1.address);
      await registry.revokeUniversity(FSS);
      await expect(registry.revokeUniversity(FSS))
        .to.be.revertedWith("University already revoked");
    });
  });

  describe("getters and list", function () {
    it("returns university details by name", async function () {
      await registry.addUniversity(FSS, uni1.address);

      const [wallet, active, exists] = await registry.getUniversityAddress(FSS);
      expect(wallet).to.equal(uni1.address);
      expect(active).to.equal(true);
      expect(exists).to.equal(true);
    });

    it("returns an empty result for an unknown university", async function () {
      const [wallet, active, exists] = await registry.getUniversityAddress(FSS);
      expect(wallet).to.equal(ethers.ZeroAddress);
      expect(active).to.equal(false);
      expect(exists).to.equal(false);
    });

    it("checks whether a wallet is an active university", async function () {
      await registry.addUniversity(FSS, uni1.address);
      expect(await registry.isActiveUniversity(uni1.address)).to.equal(true);

      await registry.revokeUniversity(FSS);
      expect(await registry.isActiveUniversity(uni1.address)).to.equal(false);
      expect(await registry.isActiveUniversity(uni2.address)).to.equal(false);
    });

    it("gets a university name by wallet", async function () {
      await registry.addUniversity(FSS, uni1.address);
      expect(await registry.getUniversityName(uni1.address)).to.equal(FSS);

      await expect(registry.getUniversityName(uni2.address))
        .to.be.revertedWith("Wallet not registered");
    });

    it("lists all registered university names", async function () {
      await registry.addUniversity(FSS, uni1.address);
      await registry.addUniversity(ENIS, uni2.address);

      expect(await registry.getUniversityNames()).to.deep.equal([FSS, ENIS]);
    });
  });
});