# Diploma Verification DApp

Blockchain app to register and verify university diplomas (Hardhat + ethers.js + MetaMask).

## Quick start (local)

```bash
git clone <repo-url>
cd Blockchain-Diploma-Verification
npm install                      # Hardhat dependencies
cd frontend && npm install && cd ..
```

Then use **3 terminals**:

```bash
# Terminal 1: local blockchain (keep it open)
npx hardhat node

# Terminal 2: deploy the contract
npx hardhat ignition deploy ignition/modules/UniversityRegistry.ts --network localhost

# Terminal 3: frontend
cd frontend && npm run dev
```

Run the tests with:

```bash
npx hardhat test
```

## MetaMask setup

- Add network: RPC `http://127.0.0.1:8545`, Chain ID `31337`, symbol `ETH`
- Import accounts from the `npx hardhat node` output:
  - **Account #0 = admin** (deploys the contract)
  - Account #1, #2... = test universities
- Use the Hardhat test keys only. Never use a real wallet or commit a private key.

After **each restart of the node**, redeploy the contract and check that `frontend/src/config.js` has the right `CONTRACT_ADDRESS`. If MetaMask complains about nonces, reset the account's activity data in its advanced settings.

## Project structure

```text
contracts/    Solidity contract (UniversityRegistry.sol)
test/         Hardhat tests
ignition/     Deployment modules
frontend/     Web interface (Vite + ethers v6)
  src/config.js   contract address (shared)
  src/utils.js    normalizeName() (shared)
  src/abi/        contract ABI (copy it again after any contract change)
```

## Registry interface (Emna)

| Function | Who | Description |
|---|---|---|
| `addUniversity(name, wallet)` | admin | Registers a university |
| `revokeUniversity(name)` | admin | Marks it revoked (record is kept) |
| `getUniversityAddress(name)` | anyone | Returns `(wallet, active, exists)` in this order |
| `isActiveUniversity(wallet)` | anyone | `true` only if the wallet is registered and not revoked. **Use this in `issueDiploma`.** |
| `getUniversityName(wallet)` | anyone | Name registered for a wallet (reverts if unknown) |
| `getUniversityNames()` | anyone | List of all registered names |

How to read `getUniversityAddress`:

- `exists = false` means unknown university
- `exists = true, active = false` means revoked university
- `exists = true, active = true` means valid

## Rules for everyone

1. **Names are lowercase.** Always call `normalizeName()` from `frontend/src/utils.js` before sending or comparing a name. The contract does not normalize.
2. A name or a wallet can only be registered **once**, and a revoked university **cannot be re-added**.
3. Verification only **reads** the chain: use `JsonRpcProvider`, no MetaMask needed.
4. If you change a contract function, copy the new ABI into `frontend/src/abi/` and tell the others.

## Git workflow

- One branch per feature (`feature/...`), never commit directly to `main`.
- Small commits with clear messages, push at the end of each session.
- Open a Pull Request and merge **without squashing**.
- Pull `main` before starting new work: `git checkout main && git pull`.
- Only edit shared files (`hardhat.config.ts`, `config.js`, `utils.js`, the ABI) in their own small commit and warn the others.

### Before you push

- Check that the deploy path and the `--network localhost` option match what actually worked for you.
- Replace `<repo-url>` and the folder name if they differ.
