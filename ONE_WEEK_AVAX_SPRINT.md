# One-week AVAX Fuji sprint

## Goal for this week
Ship one honest testnet slice:
- register with bond
- choose privacy mode
- submit evidence receipt hash
- manually appraise quality
- claim stablecoin reward
- show clear protocol status in UI
- deploy all three contracts on Fuji, but only expose M1 fully to users this week

## Split the work into two lanes

### Lane A — Lovable / online development
Use Lovable for:
- UI forms
- wallet states
- status banners
- bilingual copy
- prop wiring
- tabs and founder-only screens

Do **not** depend on Lovable for:
- Solidity correctness
- deployment scripts
- role assignment
- payout math
- testnet funding flow

### Lane B — local / offsite chain work
Do locally:
- add contracts
- install chain dependencies
- compile
- deploy to local Hardhat first
- deploy to Fuji second
- grant roles
- save addresses into frontend config

## Day-by-day

### Day 1
- Rename existing contract files to remove spaces.
- Add the new contracts and Hardhat files from this pack.
- Install chain dependencies.
- Compile locally.

### Day 2
- Run a local deployment.
- Smoke-test `register`, `submitEvidence`, `appraiseEvidence`, `claim`.
- Generate ABIs from `artifacts/`.

### Day 3
- Paste new ABI/address values into `src/lib/contract.ts`.
- Use Lovable only for frontend wiring and honest statuses.
- Add `EvidenceUpload`, `RewardsPanel`, `PrivacySettings`.

### Day 4
- Deploy to Fuji.
- Save addresses to `deployments/fuji.json`.
- Fund the reward pool with MockUSDC.
- Do one clean end-to-end test with a fresh wallet account.

### Day 5
- Add founder-only cohort view.
- Create one sample cohort and one sample mission.
- Keep these hidden behind admin/founder UI.

### Day 6
- Debug UX copy, wallet edge cases, and tx waiting states.
- Remove any fake “live chain” labels.
- Ensure no demo data appears without a DEMO MODE flag.

### Day 7
- Record a clean demo flow.
- Prepare a short founder note explaining:
  - M1 live on Fuji
  - M2 founder/backend workflow ready
  - M3 sponsor mission gateway ready

## Local chain install commands

```bash
npm install -D hardhat @nomiclabs/hardhat-ethers dotenv
npm install @openzeppelin/contracts
```

## Compile and local test commands

```bash
npx hardhat compile
npx hardhat node
npx hardhat run scripts/deploy-all.cjs --network localhost
npx hardhat run scripts/post-deploy-checks.cjs --network localhost
```

## Fuji deployment commands

```bash
cp .env.example .env
# fill private key and addresses first
npx hardhat run scripts/deploy-all.cjs --network fuji
npx hardhat run scripts/post-deploy-checks.cjs --network fuji
```

## Frontend handoff after compile
1. Copy ABI JSON from:
   - `artifacts/contracts/EvidenceRewards.sol/EvidenceRewards.json`
   - `artifacts/contracts/CohortLicensingExchange.sol/CohortLicensingExchange.json`
   - `artifacts/contracts/RecoveryMissions.sol/RecoveryMissions.json`
   - `artifacts/contracts/mocks/MockUSDC.sol/MockUSDC.json`
2. Paste ABI arrays into `src/lib/contract.ts` or `src/lib/abis/*`.
3. Paste deployed addresses from `deployments/fuji.json` into `src/lib/contract.ts`.

## Testnet guardrails
- Use a second MetaMask account for first-registration tests.
- Use tiny AVAX bond on Fuji this week, not a real $10 equivalent.
- Keep real medical files off-chain; only upload hashes/metadata references.
- Keep cohort purchase and mission creation founder/sponsor only for now.
