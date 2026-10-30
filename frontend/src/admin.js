import { BrowserProvider, Contract } from "ethers";
import abi from "./abi/UniversityRegistry.json";
import { CONTRACT_ADDRESS, CHAIN_ID } from "./config.js";

const statusEl = document.getElementById("status");
const adminSection = document.getElementById("adminSection");

let contract = null;   // contract with a signer (writes)

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
  contract = new Contract(CONTRACT_ADDRESS, abi, signer);

  const admin = await contract.admin();
  const isAdmin = admin.toLowerCase() === account.toLowerCase();

  statusEl.textContent = isAdmin
    ? `Connecté en tant qu'administrateur (${account})`
    : `Connecté (${account}) : ce compte n'est pas l'administrateur`;
  adminSection.hidden = !isAdmin;
}

document.getElementById("connectBtn").addEventListener("click", connect);