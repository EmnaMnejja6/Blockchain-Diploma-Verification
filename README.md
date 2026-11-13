# DiplômeChain - Blockchain Diploma Verification

Web platform for issuing and verifying university diplomas using blockchain technology (Hardhat + ethers.js + MetaMask).

## Features

- **Role-based authentication** (Admin & University)
- **Diploma issuance** with SHA-256 hash on blockchain
- **Public verification** without MetaMask
- **University registry** with revocation capability
- **Secure** - PDF files never leave the user's browser

## Quick Start

```bash
git clone <repo-url>
cd Blockchain-Diploma-Verification
npm install         
cd frontend && npm install && cd ..
```

**Use 3 terminals:**

```bash
# Terminal 1: Local blockchain
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat ignition deploy ignition/modules/UniversityRegistry.ts --network localhost

# Terminal 3: Frontend dev server
cd frontend && npm run dev
```

**Run tests:**
```bash
npx hardhat test
```

## MetaMask Setup

1. Add local network:
   - RPC: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Symbol: `ETH`

2. Import test accounts from `npx hardhat node` output:
   - **Account #0** = Admin (deploys contracts)
   - **Account #1, #2...** = Test universities

⚠️ **Never use real private keys or commit them to the repository.**

After restarting the node:
- Redeploy contracts
- Update `CONTRACT_ADDRESS` in `frontend/src/config.js`
- Reset MetaMask account activity if nonce errors occur

## Project Structure

```
contracts/           Smart contracts (Solidity)
  UniversityRegistry.sol   University management
  DiplomaRegistry.sol      Diploma issuance & verification
test/                Contract tests
ignition/            Deployment modules
frontend/
  index.html         Landing page (verification)
  admin.html         Admin dashboard
  issue.html         University diploma issuance
  about.html         Platform information
  src/
    auth.js          Authentication system
    admin.js         Admin logic
    issue.js         Issuance logic
    verify.js        Verification logic
    config.js        Contract addresses
    utils.js         Shared utilities
    abi/             Contract ABIs
```

## User Roles

| Role | Access | Capabilities |
|------|--------|--------------|
| **Admin** | `/admin.html` | Add/revoke universities |
| **University** | `/issue.html` | Issue/revoke diplomas |
| **Public** | `/index.html` | Verify diplomas (no MetaMask needed) |

## Smart Contract Interface

### UniversityRegistry

| Function | Who | Description |
|----------|-----|-------------|
| `addUniversity(name, wallet)` | admin | Register a university |
| `revokeUniversity(name)` | admin | Revoke university access |
| `getUniversityAddress(name)` | anyone | Returns `(wallet, active, exists)` |
| `isActiveUniversity(wallet)` | anyone | Check if wallet is active university |
| `getUniversityName(wallet)` | anyone | Get university name by wallet |
| `getUniversityNames()` | anyone | List all registered universities |

### DiplomaRegistry

| Function | Who | Description |
|----------|-----|-------------|
| `issueDiploma(hash)` | university | Register diploma hash |
| `revokeDiploma(hash, reason)` | issuer | Revoke a diploma |
| `verifyDiploma(hash)` | anyone | Check diploma status |

## Tech Stack

- **Smart Contracts:** Solidity ^0.8.24
- **Blockchain:** Hardhat (Ethereum)
- **Frontend:** Vite + Vanilla JS
- **Web3:** ethers.js v6
- **Wallet:** MetaMask
- **Hashing:** SHA-256 (client-side)
