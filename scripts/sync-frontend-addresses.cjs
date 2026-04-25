const fs = require("fs");
const path = require("path");

const root = process.cwd();
const source = path.join(root, "deployments", "fuji.json");
const targetDir = path.join(root, "src", "lib", "generated");
const target = path.join(targetDir, "fujiAddresses.ts");

if (!fs.existsSync(source)) {
  throw new Error(`Missing deployment file: ${source}`);
}

const deployment = JSON.parse(fs.readFileSync(source, "utf8"));
const addresses = deployment.addresses || {};

const mockUsdc = addresses.mockUsdc;
const evidenceRewards = addresses.evidenceRewards;
const cohortExchange = addresses.cohortExchange;
const recoveryMissions = addresses.recoveryMissions;

if (!mockUsdc || !evidenceRewards || !cohortExchange || !recoveryMissions) {
  throw new Error(
    `Deployment file is missing required addresses. Got: ${JSON.stringify(
      deployment,
      null,
      2
    )}`
  );
}

const content = `// AUTO-GENERATED FILE. DO NOT EDIT BY HAND.

export const FUJI_DEPLOYMENT = {
  MockUSDC: "${mockUsdc}",
  EvidenceRewards: "${evidenceRewards}",
  CohortLicensingExchange: "${cohortExchange}",
  RecoveryMissions: "${recoveryMissions}"
} as const;

export const MOCK_USDC_ADDRESS = FUJI_DEPLOYMENT.MockUSDC;
export const EVIDENCE_REWARDS_ADDRESS = FUJI_DEPLOYMENT.EvidenceRewards;
export const COHORT_EXCHANGE_ADDRESS = FUJI_DEPLOYMENT.CohortLicensingExchange;
export const RECOVERY_MISSIONS_ADDRESS = FUJI_DEPLOYMENT.RecoveryMissions;
`;

fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(target, content, "utf8");

console.log("Synced frontend addresses to:", target);