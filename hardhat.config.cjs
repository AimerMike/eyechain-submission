require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

const rawPrivateKey = (process.env.PRIVATE_KEY || "").trim();
const PRIVATE_KEY =
  rawPrivateKey.length === 64
    ? `0x${rawPrivateKey}`
    : rawPrivateKey.length === 66 && rawPrivateKey.startsWith("0x")
    ? rawPrivateKey
    : "";

const FUJI_RPC_URL =
  process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {},
    fuji: {
      url: FUJI_RPC_URL,
      chainId: 43113,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};