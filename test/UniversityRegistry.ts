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
});