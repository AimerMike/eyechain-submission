import { ethers } from "ethers";

// 1. 最新部署的合约地址 (Avalanche Fuji)
export const CONTRACT_ADDRESS = "0x97DD4789ceF455A084d75ddC1E553aDC95D2a323";

// 2. 完整的、格式正确的 ABI
export const CONTRACT_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "admin", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      { "internalType": "uint8", "name": "_vulnerabilityScore", "type": "uint8" },
      { "internalType": "uint8", "name": "_baselineRisk", "type": "uint8" },
      { "internalType": "bool", "name": "_hasRetinalDetachment", "type": "bool" },
      { "internalType": "bool", "name": "_hasRetinalHoles", "type": "bool" },
      { "internalType": "bool", "name": "_postOpStatus", "type": "bool" },
      { "internalType": "uint8", "name": "_surgeryType", "type": "uint8" },
      { "internalType": "uint8", "name": "_laserTreatmentCount", "type": "uint8" },
      { "internalType": "bytes32", "name": "_dataSharingLevel", "type": "bytes32" }
    ],
    "name": "registerUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }],
    "name": "getUserProfile",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "userId", "type": "uint256" },
          { "internalType": "address", "name": "userAddress", "type": "address" },
          { "internalType": "uint8", "name": "vulnerabilityScore", "type": "uint8" },
          { "internalType": "uint8", "name": "baselineRisk", "type": "uint8" },
          { "internalType": "bool", "name": "hasRetinalDetachment", "type": "bool" },
          { "internalType": "bool", "name": "hasRetinalHoles", "type": "bool" },
          { "internalType": "bool", "name": "postOpStatus", "type": "bool" },
          { "internalType": "uint8", "name": "surgeryType", "type": "uint8" },
          { "internalType": "uint8", "name": "laserTreatmentCount", "type": "uint8" },
          { "internalType": "uint256", "name": "registeredAt", "type": "uint256" },
          { "internalType": "bool", "name": "isActive", "type": "bool" },
          { "internalType": "bytes32", "name": "dataSharingLevel", "type": "bytes32" }
        ],
        "internalType": "struct UserManagement.UserProfile",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalUsers",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "registeredUsers",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// 3. 连接 MetaMask 获取合约实例
export const getContract = async () => {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    try {
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      // 强制请求连接钱包
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    } catch (error) {
      console.error("User denied account access or error occurred:", error);
      throw error;
    }
  } else {
    throw new Error("Please install MetaMask!");
  }
};

// 4. 注册用户逻辑 (对应合约 registerUser)
export const registerUser = async (
  score: number,
  risk: number,
  detachment: boolean,
  holes: boolean,
  postOp: boolean,
  surgType: number,
  laserCount: number,
  sharingLevel: string
) => {
  const contract = await getContract();
  // 核心：处理 bytes32 转换
  const bytes32Level = ethers.utils.formatBytes32String(sharingLevel);
  
  const tx = await contract.registerUser(
    score,
    risk,
    detachment,
    holes,
    postOp,
    surgType,
    laserCount,
    bytes32Level
  );
  
  console.log("Transaction sent:", tx.hash);
  const receipt = await tx.wait();
  console.log("Transaction confirmed:", receipt);
  return receipt;
};

// 5. 获取总用户数
export const getTotalUsers = async () => {
  const contract = await getContract();
  const count = await contract.totalUsers();
  return count.toNumber();
};

// 6. 获取指定用户的 Profile
export const fetchUserProfile = async (address: string) => {
  const contract = await getContract();
  const profile = await contract.getUserProfile(address);
  return profile;
};
