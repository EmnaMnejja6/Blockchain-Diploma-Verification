import { Contract, JsonRpcProvider, ZeroAddress } from "ethers";
import diplomaAbi from "./abi/DiplomaRegistry.json";
import universityAbi from "./abi/UniversityRegistry.json";
import { CONTRACT_ADDRESS, DIPLOMA_REGISTRY_ADDRESS, RPC_URL } from "./config.js";
import { normalizeName, hashFile } from "./utils.js";

const provider = new JsonRpcProvider(RPC_URL); // lecture seule, pas de MetaMask
const diplomas = new Contract(DIPLOMA_REGISTRY_ADDRESS, diplomaAbi, provider);
const universities = new Contract(CONTRACT_ADDRESS, universityAbi, provider);

function decide(diploma, university) {
    if (!diploma.exists)
        return { ok: false, message: "Non authentifié : empreinte inconnue" };
    if (!university)
        return { ok: false, message: "Non authentifié : établissement inconnu" };
    if (diploma.issuer.toLowerCase() !== university.wallet.toLowerCase())
        return { ok: false, message: "Non authentifié : émetteur différent de l'établissement saisi" };
    if (diploma.revoked)
        return { ok: false, message: "Non authentifié : diplôme révoqué", reason: diploma.reason };
    if (!university.active)
        return { ok: false, message: "Attention : cet établissement a été révoqué du registre" };
    return { ok: true, message: "Diplôme authentifié" };
}

async function getUniversity(name) {
    try {
        const [wallet, active] = await universities.getUniversityAddress(name);
        if (wallet === ZeroAddress) return null;
        return { wallet, active };
    } catch {
        return null; // le contrat refuse un nom inconnu
    }
}

async function verify(file, rawName) {
    const hash = await hashFile(file);
    const [exists, issuer, issuedAt, revoked, reason] = await diplomas.verifyDiploma(hash);
    const university = await getUniversity(normalizeName(rawName));
    const result = decide({ exists, issuer, issuedAt, revoked, reason }, university);
    return { ...result, hash, issuedAt, issuer };
}

const out = document.getElementById("result");

document.getElementById("verifyBtn").addEventListener("click", async () => {
    const name = document.getElementById("universityName").value;
    const file = document.getElementById("pdfFile").files[0];
    if (!normalizeName(name) || !file) {
        out.textContent = "Saisissez le nom de l'établissement et choisissez un PDF.";
        out.style.color = "black";
        return;
    }

    out.textContent = "Vérification en cours...";
    out.style.color = "black";
    try {
        const r = await verify(file, name);
        let text = r.message;
        if (r.reason) text += ` (motif : ${r.reason})`;
        if (r.issuedAt && r.issuedAt > 0n) {
            text += ` | Émis le ${new Date(Number(r.issuedAt) * 1000).toLocaleDateString("fr-FR")}`;
        }
        out.textContent = text;
        out.style.color = r.ok ? "green" : "red";
    } catch (err) {
        out.textContent = "Erreur : " + (err.shortMessage || err.message);
        out.style.color = "red";
    }
});