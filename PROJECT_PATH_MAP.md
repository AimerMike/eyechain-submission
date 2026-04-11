# EyeChain monetization path map

Root: `eyechain-lovable/`

## New chain files to add at repo root

```text
/contracts
  /interfaces
    IEvidenceRegistry.sol
  /mocks
    MockUSDC.sol
  EvidenceRewards.sol
  CohortLicensingExchange.sol
  RecoveryMissions.sol
/scripts
  deploy-all.cjs
  post-deploy-checks.cjs
/docs
  PROJECT_PATH_MAP.md
  ONE_WEEK_AVAX_SPRINT.md
hardhat.config.cjs
.env.example
```

## Existing files to rename first

```text
/contracts/UserManagement .sol           -> /contracts/UserManagement.sol
/contracts/RiskManagement .sol          -> /contracts/RiskManagement.sol
/contracts/DataSharingAndRewards .sol   -> /contracts/DataSharingAndRewards.sol
```

## Existing frontend files Lovable should update

```text
/src/lib/contract.ts
/src/lib/useWallet.ts
/src/pages/Index.tsx
/src/components/UserRegistration.tsx
/src/components/DataSharing.tsx
/src/components/TransactionHistory.tsx
/src/components/SubmitRiskEvent.tsx
```

## Suggested frontend-only additions for Lovable

```text
/src/components/EvidenceUpload.tsx
/src/components/RewardsPanel.tsx
/src/components/PrivacySettings.tsx
/src/components/CohortStatusPanel.tsx      # founder/admin only
/src/components/RecoveryMissionsPanel.tsx
/src/lib/abis/EvidenceRewards.json         # paste from artifact after compile
/src/lib/abis/CohortLicensingExchange.json
/src/lib/abis/RecoveryMissions.json
/src/lib/abis/MockUSDC.json
```
