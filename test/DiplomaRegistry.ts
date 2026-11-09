import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("DiplomaRegistry", function () {
    //A fake SHA-256 hash
    const hash = ethers.sha256(ethers.toUtf8Bytes("diploma-1"));

    //Runs before each test
    async function setup() {
        const [admin, university, stranger] = await ethers.getSigners();

        const universityRegistry = await ethers.deployContract("UniversityRegistry");
        await universityRegistry.addUniversity("universite de sfax", university.address);

        const diplomaRegistry = await ethers.deployContract("DiplomaRegistry", [
            await universityRegistry.getAddress(),
        ]);

        return { diplomaRegistry, admin, university, stranger };
    }

    it("lets an active university issue a diploma", async function () {
        const { diplomaRegistry, university } = await setup();

        await expect(diplomaRegistry.connect(university).issueDiploma(hash))
            .to.emit(diplomaRegistry, "DiplomaIssued");

        const d = await diplomaRegistry.diplomas(hash);
        expect(d.issuer).to.equal(university.address);
        expect(d.exists).to.equal(true);
        expect(d.revoked).to.equal(false);
    });

    it("rejects an unauthorized address", async function () {
        const { diplomaRegistry, stranger } = await setup();

        await expect(
            diplomaRegistry.connect(stranger).issueDiploma(hash)
        ).to.be.revertedWith("Not an active university");
    });

    it("rejects a duplicate diploma", async function () {
        const { diplomaRegistry, university } = await setup();

        await diplomaRegistry.connect(university).issueDiploma(hash);

        await expect(
            diplomaRegistry.connect(university).issueDiploma(hash)
        ).to.be.revertedWith("Diploma already registered");
    });

    it("lets the issuer revoke a diploma", async function () {
        const { diplomaRegistry, university } = await setup();

        await diplomaRegistry.connect(university).issueDiploma(hash);
        await diplomaRegistry.connect(university).revokeDiploma(hash, "fraud");

        const d = await diplomaRegistry.diplomas(hash);
        expect(d.revoked).to.equal(true);
        expect(d.revokeReason).to.equal("fraud");
    });

    it("rejects revocation by someone else", async function () {
        const { diplomaRegistry, university, stranger } = await setup();

        await diplomaRegistry.connect(university).issueDiploma(hash);

        await expect(
            diplomaRegistry.connect(stranger).revokeDiploma(hash, "nope")
        ).to.be.revertedWith("Only the issuer can revoke");
    });
})