const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const networkName = hre.network.name;
  const deployment = JSON.parse(fs.readFileSync(`deployments/${networkName}.json`, "utf8"));

  const evidence = await hre.ethers.getContractAt("EvidenceRewards", deployment.addresses.evidenceRewards);
  const cohort = await hre.ethers.getContractAt("CohortLicensingExchange", deployment.addresses.cohortExchange);
  const missions = await hre.ethers.getContractAt("RecoveryMissions", deployment.addresses.recoveryMissions);

  console.log("EvidenceRewards rewardToken:", await evidence.rewardToken());
  console.log("EvidenceRewards registerBondWei:", (await evidence.registerBondWei()).toString());
  console.log("Cohort treasury:", await cohort.treasury());
  console.log("RecoveryMissions registry:", await missions.registry());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
