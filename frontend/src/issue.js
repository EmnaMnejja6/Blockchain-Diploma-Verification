import { BrowserProvider, Contract } from "ethers";
import diplomaAbi from "./abi/DiplomaRegistry.json";
import universityAbi from "./abi/UniversityRegistry.json";
import {
  CONTRACT_ADDRESS,
  DIPLOMA_REGISTRY_ADDRESS,
  CHAIN_ID,
} from "./config.js";
import { hashFile } from "./utils.js";

const statusEl = document.getElementById("status");
const issueSection = document.getElementById("issueSection");
const fileInput = document.getElementById("fileInput");
const hashOut = document.getElementById("hashOut");
const issueBtn = document.getElementById("issueBtn");
const messageEl = document.getElementById("message");
const txOut = document.getElementById("txOut");

let diplomaContract = null;
let currentHash = null;

async function connect() {
  if (!window.ethereum) {
    statusEl.textContent = "MetaMask n'est pas installé";
    return;
  }
  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);

  const network = await provider.getNetwork();
  if (network.chainId !== CHAIN_ID) {
    statusEl.textContent = "Mauvais réseau : choisissez Hardhat (31337)";
    return;
  }

  const signer = await provider.getSigner();
  const account = await signer.getAddress();
  diplomaContract = new Contract(DIPLOMA_REGISTRY_ADDRESS, diplomaAbi, signer);

  // Ask Emna's registry whether this wallet is an active university
  const registry = new Contract(CONTRACT_ADDRESS, universityAbi, provider);
  const active = await registry.isActiveUniversity(account);

  if (active) {
    const name = await registry.getUniversityName(account);
    statusEl.textContent = `Connecté en tant que ${name} (${account})`;
  } else {
    statusEl.textContent = `Connecté (${account}) : ce compte n'est pas une université active`;
  }
  issueSection.hidden = false;
}

document.getElementById("connectBtn").addEventListener("click", connect);

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
  if (!diplomaContract) {
    messageEl.textContent = "Connectez d'abord MetaMask";
    return;
  }
  try {
    messageEl.textContent = "Confirmez dans MetaMask...";
    const tx = await diplomaContract.issueDiploma(currentHash);
    messageEl.textContent = "Transaction envoyée, attente de confirmation...";
    await tx.wait();
    messageEl.textContent = "Diplôme émis !";
    txOut.textContent = tx.hash;
  } catch (err) {
    messageEl.textContent =
      "Erreur : " + (err.reason || err.shortMessage || err.message);
  }
}

issueBtn.addEventListener("click", issue);