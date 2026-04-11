const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const registerBondWei = process.env.REGISTER_BOND_WEI || hre.ethers.utils.parseEther("0.01").toString();
  const treasury = process.env.TREASURY_ADDRESS || deployer.address;
  const reserveVault = process.env.RESERVE_VAULT_ADDRESS || deployer.address;

  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUsdc = await MockUSDC.deploy(deployer.address);
  await mockUsdc.deployed();
  console.log("MockUSDC:", mockUsdc.address);

  const EvidenceRewards = await hre.ethers.getContractFactory("EvidenceRewards");
  const evidenceRewards = await EvidenceRewards.deploy(
    deployer.address,
    mockUsdc.address,
    registerBondWei
  );
  await evidenceRewards.deployed();
  console.log("EvidenceRewards:", evidenceRewards.address);

  const CohortLicensingExchange = await hre.ethers.getContractFactory("CohortLicensingExchange");
  const cohortExchange = await CohortLicensingExchange.deploy(
    deployer.address,
    evidenceRewards.address,
    mockUsdc.address,
    treasury,
    reserveVault
  );
  await cohortExchange.deployed();
  console.log("CohortLicensingExchange:", cohortExchange.address);

  const RecoveryMissions = await hre.ethers.getContractFactory("RecoveryMissions");
  const recoveryMissions = await RecoveryMissions.deploy(
    deployer.address,
    evidenceRewards.address,
    mockUsdc.address
  );
  await recoveryMissions.deployed();
  console.log("RecoveryMissions:", recoveryMissions.address);

  const CREDITOR_ROLE = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("CREDITOR_ROLE"));
  const REVIEWER_ROLE = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("REVIEWER_ROLE"));

  await (await evidenceRewards.grantRole(CREDITOR_ROLE, cohortExchange.address)).wait();
  await (await evidenceRewards.grantRole(CREDITOR_ROLE, recoveryMissions.address)).wait();
  await (await recoveryMissions.grantRole(REVIEWER_ROLE, deployer.address)).wait();

  const bootstrapRewardPool = process.env.BOOTSTRAP_REWARD_POOL || "500000000"; // 500 mUSDC at 6 decimals
  await (await mockUsdc.mint(deployer.address, bootstrapRewardPool)).wait();
  await (await mockUsdc.transfer(evidenceRewards.address, bootstrapRewardPool)).wait();

  const out = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    addresses: {
      mockUsdc: mockUsdc.address,
      evidenceRewards: evidenceRewards.address,
      cohortExchange: cohortExchange.address,
      recoveryMissions: recoveryMissions.address,
      treasury,
      reserveVault,
    },
    registerBondWei,
    bootstrapRewardPool,
  };

  const outPath = path.join(process.cwd(), "deployments");
  fs.mkdirSync(outPath, { recursive: true });
  fs.writeFileSync(path.join(outPath, `${hre.network.name}.json`), JSON.stringify(out, null, 2));
  console.log("Saved deployment file to deployments/" + `${hre.network.name}.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
