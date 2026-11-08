import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("verifyDiploma", function () {
    const hash = ethers.sha256(ethers.toUtf8Bytes("diploma-1"));

    async function setup() {
        const [admin, university, otherUniversity] = await ethers.getSigners();

        const universityRegistry = await ethers.deployContract("UniversityRegistry");
        await universityRegistry.addUniversity("universite de sfax", university.address);
        await universityRegistry.addUniversity("universite de tunis", otherUniversity.address);

        const diplomaRegistry = await ethers.deployContract("DiplomaRegistry", [
            await universityRegistry.getAddress(),
        ]);

        return { diplomaRegistry, universityRegistry, university, otherUniversity };
    }

    it("returns exists = false for an unknown hash", async function () {
        const { diplomaRegistry } = await setup();

        const r = await diplomaRegistry.verifyDiploma(hash);
        expect(r.exists).to.equal(false);
    });

    it("returns issuer, date and valid status for an issued diploma", async function () {
        const { diplomaRegistry, university } = await setup();
        await diplomaRegistry.connect(university).issueDiploma(hash);

        const r = await diplomaRegistry.verifyDiploma(hash);
        expect(r.exists).to.equal(true);
        expect(r.issuer).to.equal(university.address);
        expect(r.issuedAt).to.be.gt(0n);
        expect(r.revoked).to.equal(false);
        expect(r.reason).to.equal("");
    });

    it("returns revoked status and reason for a revoked diploma", async function () {
        const { diplomaRegistry, university } = await setup();
        await diplomaRegistry.connect(university).issueDiploma(hash);
        await diplomaRegistry.connect(university).revokeDiploma(hash, "fraud");

        const r = await diplomaRegistry.verifyDiploma(hash);
        expect(r.revoked).to.equal(true);
        expect(r.reason).to.equal("fraud");
    });

    it("does not find a modified PDF (different hash)", async function () {
        const { diplomaRegistry, university } = await setup();
        await diplomaRegistry.connect(university).issueDiploma(hash);

        const modifiedHash = ethers.sha256(ethers.toUtf8Bytes("diploma-1-modified"));
        const r = await diplomaRegistry.verifyDiploma(modifiedHash);
        expect(r.exists).to.equal(false);
    });

    it("detects a different establishment (issuer != registry address)", async function () {
        const { diplomaRegistry, universityRegistry, university } = await setup();
        await diplomaRegistry.connect(university).issueDiploma(hash);

        const r = await diplomaRegistry.verifyDiploma(hash);
        const tunisAddress = await universityRegistry.getUniversityAddress("universite de tunis");

        expect(r.issuer).to.not.equal(tunisAddress);
    });
});