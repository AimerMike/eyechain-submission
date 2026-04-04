import { ethers } from "ethers";

export const FUJI_CHAIN_ID = 43113;
export const FUJI_CHAIN_HEX = "0xa869";
export const FUJI_EXPLORER = "https://testnet.snowtrace.io";

export const CONTRACT_ADDRESS = "0x97DD4789ceF455A084d75ddC1E553aDC95D2a323";

export const CONTRACT_ABI = [
  {
    inputs: [{ internalType: "address", name: "admin", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      { internalType: "uint8", name: "_vulnerabilityScore", type: "uint8" },
      { internalType: "uint8", name: "_baselineRisk", type: "uint8" },
      { internalType: "bool", name: "_hasRetinalDetachment", type: "bool" },
      { internalType: "bool", name: "_hasRetinalHoles", type: "bool" },
      { internalType: "bool", name: "_postOpStatus", type: "bool" },
      { internalType: "uint8", name: "_surgeryType", type: "uint8" },
      { internalType: "uint8", name: "_laserTreatmentCount", type: "uint8" },
      { internalType: "bytes32", name: "_dataSharingLevel", type: "bytes32" },
    ],
    name: "registerUser",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "getUserProfile",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "userId", type: "uint256" },
          { internalType: "address", name: "userAddress", type: "address" },
          { internalType: "uint8", name: "vulnerabilityScore", type: "uint8" },
          { internalType: "uint8", name: "baselineRisk", type: "uint8" },
          { internalType: "bool", name: "hasRetinalDetachment", type: "bool" },
          { internalType: "bool", name: "hasRetinalHoles", type: "bool" },
          { internalType: "bool", name: "postOpStatus", type: "bool" },
          { internalType: "uint8", name: "surgeryType", type: "uint8" },
          { internalType: "uint8", name: "laserTreatmentCount", type: "uint8" },
          { internalType: "uint256", name: "registeredAt", type: "uint256" },
          { internalType: "bool", name: "isActive", type: "bool" },
          { internalType: "bytes32", name: "dataSharingLevel", type: "bytes32" },
        ],
        internalType: "struct UserManagement.UserProfile",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalUsers",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "registeredUsers",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
];

type ContractWithMethods = ethers.Contract & Record<string, (...args: any[]) => Promise<any>>;

export type WalletConnection = {
  address: string;
  provider: ethers.providers.Web3Provider;
  signer: ethers.Signer;
};

export interface SymptomFlags {
  floaters: boolean;
  flashes: boolean;
  pain: boolean;
  visionLoss: boolean;
}

const riskCodeMap = {
  low: 0,
  medium: 1,
  high: 2,
} as const;

const surgeryCodeMap = {
  none: 0,
  external: 1,
  internal: 2,
  icl: 3,
  lasik: 4,
} as const;

const sharingCodeMap = {
  none: "None",
  research: "Research",
  healthcare: "Healthcare",
  public: "Public",
} as const;

const getEthereum = () => {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("Please install MetaMask / 请先安装 MetaMask");
  }

  return (window as any).ethereum;
};

export const getProvider = () => new ethers.providers.Web3Provider(getEthereum());

export const isFujiChain = (chainId: number | string) => Number(chainId) === FUJI_CHAIN_ID;

export const ensureFujiNetwork = async (provider: ethers.providers.Web3Provider) => {
  const network = await provider.getNetwork();

  if (!isFujiChain(network.chainId)) {
    throw new Error("Please switch MetaMask to Avalanche Fuji (43113) / 请切换 MetaMask 到 Avalanche Fuji (43113)");
  }

  return network;
};

export const connectWallet = async (): Promise<WalletConnection> => {
  const provider = getProvider();
  await provider.send("eth_requestAccounts", []);
  await ensureFujiNetwork(provider);

  const signer = provider.getSigner();
  const address = await signer.getAddress();

  return { address, provider, signer };
};

export const getContract = (signerOrProvider?: ethers.Signer | ethers.providers.Provider | null) => {
  const connection = signerOrProvider ?? getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, connection);
};

export const shortenAddress = (address: string | null | undefined, visible = 4) => {
  if (!address) return "";
  return `${address.slice(0, visible + 2)}...${address.slice(-visible)}`;
};

export const clampUint8 = (value: number, min = 0, max = 255) => {
  const safeValue = Number.isFinite(value) ? Math.trunc(value) : 0;
  return Math.max(min, Math.min(max, safeValue));
};

export const baselineRiskToCode = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("low")) return riskCodeMap.low;
  if (normalized.includes("high")) return riskCodeMap.high;
  return riskCodeMap.medium;
};

export const baselineRiskLabel = (value: number) => {
  if (Number(value) === riskCodeMap.low) return "Low 低";
  if (Number(value) === riskCodeMap.high) return "High 高";
  return "Medium 中";
};

export const surgeryTypeToCode = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("external")) return surgeryCodeMap.external;
  if (normalized.includes("internal")) return surgeryCodeMap.internal;
  if (normalized.includes("icl")) return surgeryCodeMap.icl;
  if (normalized.includes("lasik")) return surgeryCodeMap.lasik;
  return surgeryCodeMap.none;
};

export const surgeryTypeLabel = (value: number) => {
  if (Number(value) === surgeryCodeMap.external) return "External 外路";
  if (Number(value) === surgeryCodeMap.internal) return "Internal 内路";
  if (Number(value) === surgeryCodeMap.icl) return "ICL";
  if (Number(value) === surgeryCodeMap.lasik) return "LASIK";
  return "None 无";
};

export const sharingLevelToText = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("research")) return sharingCodeMap.research;
  if (normalized.includes("health")) return sharingCodeMap.healthcare;
  if (normalized.includes("public")) return sharingCodeMap.public;
  return sharingCodeMap.none;
};

export const sharingLevelToBytes32 = (value: string) => ethers.utils.formatBytes32String(sharingLevelToText(value));

export const bytes32ToText = (value: string) => {
  try {
    return ethers.utils.parseBytes32String(value);
  } catch {
    return value.replace(/\0/g, "");
  }
};

export const dataSharingLabel = (value: string) => {
  const normalized = bytes32ToText(value).toLowerCase();
  if (normalized === "research") return "Research 研究";
  if (normalized === "healthcare") return "Healthcare 医疗";
  if (normalized === "public") return "Public 公开";
  return "None 无";
};

export const symptomsToFlag = (floaters: boolean, flashes: boolean, pain: boolean, visionLoss: boolean) => {
  return (floaters ? 1 : 0) + (flashes ? 2 : 0) + (pain ? 4 : 0) + (visionLoss ? 8 : 0);
};

export const flagToSymptoms = (flag: number): SymptomFlags => ({
  floaters: Boolean(flag & 1),
  flashes: Boolean(flag & 2),
  pain: Boolean(flag & 4),
  visionLoss: Boolean(flag & 8),
});

export const hasContractMethod = (contract: ethers.Contract | null, methodName: string) => {
  return Boolean(contract && typeof (contract as Record<string, unknown>)[methodName] === "function");
};

export const ensureContractMethod = (contract: ethers.Contract | null, methodName: string, featureName?: string): ContractWithMethods => {
  if (!hasContractMethod(contract, methodName)) {
    throw new Error(`${featureName ?? methodName} is not available in the current deployed contract / 当前已部署合约不支持该功能`);
  }

  return contract as ContractWithMethods;
};

export const registerUser = async (
  score: number,
  risk: number,
  detachment: boolean,
  holes: boolean,
  postOp: boolean,
  surgType: number,
  laserCount: number,
  sharingLevel: string,
  signer?: ethers.Signer,
) => {
  const activeSigner = signer ?? (await connectWallet()).signer;
  const contract = ensureContractMethod(getContract(activeSigner), "registerUser", "Register");

  const tx = await contract.registerUser(
    clampUint8(score, 0, 100),
    clampUint8(risk),
    detachment,
    holes,
    postOp,
    clampUint8(surgType),
    clampUint8(laserCount),
    sharingLevelToBytes32(sharingLevel),
  );

  console.log("Transaction sent:", tx.hash);
  const receipt = await tx.wait();
  console.log("Transaction confirmed:", receipt);
  return receipt;
};

export const getTotalUsers = async () => {
  const contract = ensureContractMethod(getContract(), "totalUsers", "Total Users");
  const count = await contract.totalUsers();
  return Number(count);
};

export const fetchUserProfile = async (address: string) => {
  const contract = ensureContractMethod(getContract(), "getUserProfile", "Get User Profile");
  return contract.getUserProfile(address);
};
