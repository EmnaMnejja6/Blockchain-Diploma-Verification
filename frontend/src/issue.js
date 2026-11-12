import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import diplomaAbi from "./abi/DiplomaRegistry.json";
import universityAbi from "./abi/UniversityRegistry.json";
import {
  CONTRACT_ADDRESS,
  DIPLOMA_REGISTRY_ADDRESS,
  CHAIN_ID,
  RPC_URL,
} from "./config.js";
import { hashFile, shortAddress } from "./utils.js";

const statusEl = document.getElementById("status");
const issueSection = document.getElementById("issueSection");
const listSection = document.getElementById("listSection");
const fileInput = document.getElementById("fileInput");
const hashOut = document.getElementById("hashOut");
const issueBtn = document.getElementById("issueBtn");
const messageEl = document.getElementById("message");
const txOut = document.getElementById("txOut");
const listEl = document.getElementById("diplomaList");
const emptyEl = document.getElementById("emptyList");

let diplomaContract = null; // with signer (writes)
let currentAccount = null;
let isActive = false;
let currentHash = null;

// Read-only contract: no MetaMask needed (README rule 3)
const readDiploma = new Contract(
  DIPLOMA_REGISTRY_ADDRESS,
  diplomaAbi,
  new JsonRpcProvider(RPC_URL)
);

// Auto-connect if coming from login page
async function autoConnect() {
  const storedAccount = sessionStorage.getItem("connectedAccount");
  const userRole = sessionStorage.getItem("userRole");
  const timestamp = sessionStorage.getItem("connectionTimestamp");

  // Check if session is recent (within 5 minutes)
  if (storedAccount && userRole === "university" && timestamp) {
    const age = Date.now() - parseInt(timestamp);
    if (age < 5 * 60 * 1000) {
      await connect(true);
      return;
    }
  }
}

async function connect(isAutoConnect = false) {
  if (!window.ethereum) {
    statusEl.textContent = "MetaMask n'est pas installé";
    return;
  }
  const provider = new BrowserProvider(window.ethereum);
  
  // If auto-connecting, don't request accounts again
  if (!isAutoConnect) {
    await provider.send("eth_requestAccounts", []);
  }

  const network = await provider.getNetwork();
  if (network.chainId !== CHAIN_ID) {
    statusEl.textContent = "Mauvais réseau : choisissez Hardhat (31337)";
    return;
  }

  const signer = await provider.getSigner();
  currentAccount = await signer.getAddress();
  diplomaContract = new Contract(DIPLOMA_REGISTRY_ADDRESS, diplomaAbi, signer);

  const registry = new Contract(CONTRACT_ADDRESS, universityAbi, provider);
  isActive = await registry.isActiveUniversity(currentAccount);

  if (isActive) {
    const name = await registry.getUniversityName(currentAccount);
    
    // Update the navbar user profile
    const userName = document.getElementById("userName");
    if (userName) {
      userName.textContent = name;
    }
    
    statusEl.textContent = `Connecté en tant que ${name} (${currentAccount})`;
  } else {
    statusEl.textContent = `Connecté (${currentAccount}) : ce compte n'est pas une université active`;
    window.location.href = "/index.html";
    return;
  }

  if (isActive) await loadDiplomas();
}

// If the user switches account or network in MetaMask, start over
if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => location.reload());
  window.ethereum.on("chainChanged", () => location.reload());
}

async function loadDiplomas() {
  listEl.textContent = "";

  const events = await readDiploma.queryFilter(
    readDiploma.filters.DiplomaIssued(null, currentAccount)
  );
  emptyEl.hidden = events.length > 0;

  for (const ev of events.reverse()) {       // newest first
    const hash = ev.args[0];
    const d = await readDiploma.diplomas(hash);

    const row = document.createElement("tr");
    const date = new Date(Number(d.issuedAt) * 1000).toLocaleString("fr-FR");
    const statut = d.revoked ? `Révoqué (${d.revokeReason})` : "Valide";

    for (const text of [shortAddress(hash), date, statut]) {
      const td = document.createElement("td");
      td.textContent = text;
      row.appendChild(td);
    }
    row.firstChild.title = hash;             // full hash on mouse hover

    const actionTd = document.createElement("td");
    if (!d.revoked) {
      const btn = document.createElement("button");
      btn.textContent = "Révoquer";
      btn.addEventListener("click", () => revoke(hash));
      actionTd.appendChild(btn);
    }
    row.appendChild(actionTd);
    listEl.appendChild(row);
  }
}

async function revoke(hash) {
  const reason = prompt("Motif de la révocation :");
  if (!reason) return;
  try {
    messageEl.textContent = "Confirmez dans MetaMask...";
    const tx = await diplomaContract.revokeDiploma(hash, reason);
    await tx.wait();
    messageEl.textContent = "Diplôme révoqué";
    await loadDiplomas();
  } catch (err) {
    messageEl.textContent =
      "Erreur : " + (err.reason || err.shortMessage || err.message);
  }
}

// When a PDF is chosen, compute its hash in the browser (the PDF is never sent anywhere)
fileInput.addEventListener("change", async () => {
  txOut.textContent = "-";
  messageEl.textContent = "";
  const file = fileInput.files[0];
  if (!file) {
    currentHash = null;
    hashOut.textContent = "-";
    issueBtn.disabled = true;
    return;
  }
  currentHash = await hashFile(file);
  hashOut.textContent = currentHash;
  issueBtn.disabled = false;
});

async function issue() {
  if (!diplomaContract || !isActive) {
    messageEl.textContent = "Connectez une université active d'abord";
    return;
  }
  try {
    messageEl.textContent = "Confirmez dans MetaMask...";
    const tx = await diplomaContract.issueDiploma(currentHash);
    messageEl.textContent = "Transaction envoyée, attente de confirmation...";
    await tx.wait();
    messageEl.textContent = "Diplôme émis !";
    txOut.textContent = tx.hash;
    await loadDiplomas();                    // refresh the list
  } catch (err) {
    messageEl.textContent =
      "Erreur : " + (err.reason || err.shortMessage || err.message);
  }
}

issueBtn.addEventListener("click", issue);

// Auto-connect on page load
autoConnect();