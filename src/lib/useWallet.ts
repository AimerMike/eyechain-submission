import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import {
  FUJI_CHAIN_ID,
  FUJI_CONFIG,
  getMockUsdcContract,
  getEvidenceRewardsContract,
  getCohortExchangeContract,
  getRecoveryMissionsContract,
  MOCK_USDC_ADDRESS,
  EVIDENCE_REWARDS_ADDRESS,
  COHORT_EXCHANGE_ADDRESS,
  RECOVERY_MISSIONS_ADDRESS,
} from "./contract";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWallet() {
  const [account, setAccount] = useState<string>("");
  const [provider, setProvider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const syncWalletState = async (ethereum: any) => {
    const web3Provider = new ethers.providers.Web3Provider(ethereum);
    setProvider(web3Provider);

    const network = await web3Provider.getNetwork();
    setChainId(network.chainId);

    const accounts = await web3Provider.listAccounts();
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      setSigner(web3Provider.getSigner());
    } else {
      setAccount("");
      setSigner(null);
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;

    syncWalletState(window.ethereum);

    const handleAccountsChanged = async () => {
      await syncWalletState(window.ethereum);
    };

    const handleChainChanged = async () => {
      await syncWalletState(window.ethereum);
    };

    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.(
        "accountsChanged",
        handleAccountsChanged
      );
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  const switchToFuji = async () => {
    if (!window.ethereum) throw new Error("MetaMask not found");

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: FUJI_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      if (switchError?.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [FUJI_CONFIG],
        });
      } else {
        throw switchError;
      }
    }

    await syncWalletState(window.ethereum);
  };

  const connectWallet = async () => {
    if (!window.ethereum) throw new Error("MetaMask not found");

    await window.ethereum.request({ method: "eth_requestAccounts" });
    await syncWalletState(window.ethereum);

    const currentProvider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await currentProvider.getNetwork();

    if (network.chainId !== FUJI_CHAIN_ID) {
      await switchToFuji();
    }
  };

  const isFuji = chainId === FUJI_CHAIN_ID;

  const mockUsdcContract = useMemo(() => {
    if (!signer || !MOCK_USDC_ADDRESS) return null;
    try {
      return getMockUsdcContract(signer);
    } catch (error) {
      console.error("mockUsdcContract init failed", error);
      return null;
    }
  }, [signer]);

  const evidenceRewardsContract = useMemo(() => {
    if (!signer || !EVIDENCE_REWARDS_ADDRESS) return null;
    try {
      return getEvidenceRewardsContract(signer);
    } catch (error) {
      console.error("evidenceRewardsContract init failed", error);
      return null;
    }
  }, [signer]);

  const cohortExchangeContract = useMemo(() => {
    if (!signer || !COHORT_EXCHANGE_ADDRESS) return null;
    try {
      return getCohortExchangeContract(signer);
    } catch (error) {
      console.error("cohortExchangeContract init failed", error);
      return null;
    }
  }, [signer]);

  const recoveryMissionsContract = useMemo(() => {
    if (!signer || !RECOVERY_MISSIONS_ADDRESS) return null;
    try {
      return getRecoveryMissionsContract(signer);
    } catch (error) {
      console.error("recoveryMissionsContract init failed", error);
      return null;
    }
  }, [signer]);

  return {
    account,
    provider,
    signer,
    chainId,
    isFuji,
    connectWallet,
    switchToFuji,
    mockUsdcContract,
    evidenceRewardsContract,
    cohortExchangeContract,
    recoveryMissionsContract,
  };
}