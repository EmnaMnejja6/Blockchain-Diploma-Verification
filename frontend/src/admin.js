import { BrowserProvider, Contract, JsonRpcProvider, isAddress } from "ethers";
import abi from "./abi/UniversityRegistry.json";
import { CONTRACT_ADDRESS, CHAIN_ID, RPC_URL } from "./config.js";
import { normalizeName, shortAddress } from "./utils.js";

const statusEl = document.getElementById("status");
const adminSection = document.getElementById("adminSection");
const messageEl = document.getElementById("message");

let contract = null;

const readContract = new Contract(
  CONTRACT_ADDRESS,
  abi,
  new JsonRpcProvider(RPC_URL)
);

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

  await loadList();
}

document.getElementById("connectBtn").addEventListener("click", connect);

async function loadList() {
  const listEl = document.getElementById("list");
  listEl.textContent = "";
  const names = await readContract.getUniversityNames();

  for (const name of names) {
    const [wallet, active] = await readContract.getUniversityAddress(name);
    const row = document.createElement("tr");

    for (const text of [name, shortAddress(wallet), active ? "Active" : "Révoquée"]) {
      const td = document.createElement("td");
      td.textContent = text;
      row.appendChild(td);
    }

    const actionTd = document.createElement("td");
    if (active && contract) {
      const btn = document.createElement("button");
      btn.textContent = "Révoquer";
      btn.addEventListener("click", () => revoke(name));
      actionTd.appendChild(btn);
    }
    row.appendChild(actionTd);
    listEl.appendChild(row);
  }
}

async function revoke(name) {
  try {
    const tx = await contract.revokeUniversity(name);
    await tx.wait();
    await loadList();
  } catch (err) {
    messageEl.textContent = "Erreur : " + (err.reason || err.shortMessage || err.message);
  }
}

async function addUniversity() {
  const name = normalizeName(document.getElementById("nameInput").value);
  const wallet = document.getElementById("walletInput").value.trim();

  if (!name) return (messageEl.textContent = "Nom vide");
  if (!isAddress(wallet)) return (messageEl.textContent = "Adresse invalide");

  try {
    messageEl.textContent = "Confirmez dans MetaMask...";
    const tx = await contract.addUniversity(name, wallet);
    messageEl.textContent = "Transaction envoyée, attente de confirmation...";
    await tx.wait();
    messageEl.textContent = "Université ajoutée";
    await loadList();
  } catch (err) {
    messageEl.textContent = "Erreur : " + (err.reason || err.shortMessage || err.message);
  }
}

document.getElementById("addBtn").addEventListener("click", addUniversity);

loadList();