# Blockchain Diploma Verification

A Hardhat 3 project for managing the universities authorized to issue blockchain diplomas.

## Contracts

### UniversityRegistry

The `UniversityRegistry` contract provides admin-controlled university registration and revocation.

- Sets the deployer as the administrator.
- Registers universities by name and wallet address.
- Rejects empty names, zero addresses, duplicate names, and duplicate wallets.
- Revokes registered universities.
- Supports lookup by university name or wallet address.
- Lists all registered university names.

## Prerequisites

- Node.js 22 or newer
- npm

## Installation

```bash
npm install
```

## Compile Contracts

```bash
npx hardhat build
```

## Run Tests

Run all Solidity and Mocha tests:

```bash
npx hardhat test
```

Run only Solidity tests:

```bash
npx hardhat test solidity
```

Run only TypeScript/Mocha tests:

```bash
npx hardhat test mocha
```

## Deploy with Hardhat Ignition

### Local Hardhat Network

```bash
npx hardhat ignition deploy ./ignition/modules/UniversityRegistry.ts
```

The local deployment uses an in-process Hardhat Network and is reset after the process ends.

### Sepolia

Configure the RPC URL and private key:

```bash
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

Then deploy:

```bash
npx hardhat ignition deploy ./ignition/modules/UniversityRegistry.ts --network sepolia
```

## Registry Functions

### Admin

```solidity
addUniversity(string name, address wallet)
revokeUniversity(string name)
```

### Read Functions

```solidity
getUniversityAddress(string name)
isActiveUniversity(address wallet)
getUniversityName(address wallet)
getUniversityNames()
```

## Project Structure

```text
contracts/                  Solidity contracts and Solidity tests
ignition/modules/           Hardhat Ignition deployment modules
test/                       TypeScript/Mocha integration tests
artifacts/                  Compiled contract artifacts
types/ethers-contracts/     Generated ethers contract types
```
