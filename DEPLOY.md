# EyeChain Contract Deployment Guide

## Deployment Order

1. **UserManagement** — already deployed at `0x97DD4789ceF455A084d75ddC1E553aDC95D2a323`
2. **RiskManagement** — depends on UserManagement address
3. **DataSharingAndRewards** — depends on UserManagement + RiskManagement addresses

## Deploy RiskManagement via Remix

1. Open [Remix IDE](https://remix.ethereum.org)
2. Upload `contracts/RiskManagement.sol` (and `UserManagement.sol` if needed for imports)
3. Compile with Solidity 0.8.x
4. In "Deploy & Run":
   - Environment: **Injected Provider (MetaMask)** on Avalanche Fuji (43113)
   - Constructor args:
     - `admin`: your wallet address
     - `userManagement`: `0x97DD4789ceF455A084d75ddC1E553aDC95D2a323`
5. Deploy and copy the deployed address

## Deploy DataSharingAndRewards via Remix

1. Upload `contracts/DataSharingAndRewards.sol`
2. Constructor args:
   - `admin`: your wallet address
   - `userManagement`: `0x97DD4789ceF455A084d75ddC1E553aDC95D2a323`
   - `riskManagement`: (address from step above)
   - `rewardToken`: use zero address `0x0000000000000000000000000000000000000000` for native AVAX mode, or an ERC20 address
3. Deploy and copy the deployed address

## Deploy EvidenceRewards via Remix

1. Upload `contracts/EvidenceRewards.sol`
2. Constructor args:
   - `admin`: your wallet address
3. Deploy and copy the deployed address
4. Fund the contract with AVAX so it can pay out rewards

## Update Frontend

Edit `src/lib/contract.ts` lines 20-22:

```ts
export const RISK_MGMT_ADDRESS = "0xYOUR_RISK_CONTRACT_ADDRESS";
export const DATA_REWARDS_ADDRESS = "0xYOUR_REWARDS_CONTRACT_ADDRESS";
export const EVIDENCE_REWARDS_ADDRESS = "0xYOUR_EVIDENCE_CONTRACT_ADDRESS";
```

Once both addresses are set, the Protocol Status indicator will show **LIVE** instead of **PARTIAL**.

## Verify on Snowtrace

```
https://testnet.snowtrace.io/address/YOUR_ADDRESS
```
