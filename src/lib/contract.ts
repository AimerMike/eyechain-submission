import { ethers } from "ethers";

// Replace with your deployed contract address on Avalanche Fuji
export const CONTRACT_ADDRESS = "0xf523f4a5fFc4C1fA4Aa75169754ffFcB51c34f81";

export const FUJI_CHAIN_ID = "0xa869"; // 43113
export const FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";
export const FUJI_EXPLORER = "https://testnet.snowtrace.io";

export const FUJI_NETWORK_PARAMS = {
  chainId: FUJI_CHAIN_ID,
  chainName: "Avalanche Fuji C-Chain",
  nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
  rpcUrls: [FUJI_RPC],
  blockExplorerUrls: [`${FUJI_EXPLORER}/`],
};

export const CONTRACT_ABI = [
  "function registerProfile(uint8 _score, bool _postOp) external",
  "function submitRiskEvent(uint16 accel, uint16 posture, uint16 duration, uint8 symptoms) external",
  "function recalibrate(uint256 _alert, uint256 _critical) external",
  "function getHistory(address user) external view returns (tuple(uint64 timestamp, uint16 accelLoad, uint16 postureLoad, uint16 durationScore, uint8 symptomsFlag, uint16 totalRisk)[])",
  "function profiles(address) external view returns (uint8 vulnerabilityScore, bool postOpStatus, uint64 registeredAt)",
  "function alertThreshold() external view returns (uint256)",
  "function criticalThreshold() external view returns (uint256)",
  "function decodeSymptoms(uint8 flags) public pure returns (bool hasFloaters, bool hasFlashes, bool hasPain)",
  "event RiskLogged(address indexed user, uint16 risk, uint256 ts)",
  "event AlertTriggered(address indexed user, string level)",
  "event ThresholdUpdated(uint256 alert, uint256 critical)",
];

export function getProvider(): ethers.providers.Web3Provider | null {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return new ethers.providers.Web3Provider((window as any).ethereum);
  }
  return null;
}

export function getContract(signerOrProvider: ethers.Signer | ethers.providers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
}

export async function connectWallet(): Promise<{ address: string; signer: ethers.Signer } | null> {
  const provider = getProvider();
  if (!provider) {
    alert("Please install MetaMask!");
    return null;
  }
  await provider.send("eth_requestAccounts", []);
  const network = await provider.getNetwork();
  if (network.chainId !== 43113) {
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: FUJI_CHAIN_ID }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [FUJI_NETWORK_PARAMS],
        });
      } else {
        throw switchError;
      }
    }
  }
  const signer = provider.getSigner();
  const address = await signer.getAddress();
  return { address, signer };
}

export function shortenAddress(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export function symptomsToFlag(floaters: boolean, flashes: boolean, pain: boolean, visionLoss: boolean): number {
  let flag = 0;
  if (floaters) flag |= 1;
  if (flashes) flag |= 2;
  if (pain) flag |= 4;
  if (visionLoss) flag |= 8;
  return flag;
}

export function flagToSymptoms(flag: number) {
  return {
    floaters: (flag & 1) !== 0,
    flashes: (flag & 2) !== 0,
    pain: (flag & 4) !== 0,
    visionLoss: (flag & 8) !== 0,
  };
}
