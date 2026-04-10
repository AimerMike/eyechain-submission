import { useState, useCallback, useMemo } from "react";
import { ethers } from "ethers";
import {
  connectWallet,
  getContract,
  getRiskContract,
  getDataRewardsContract,
  getEvidenceRewardsContract,
  RISK_MGMT_ADDRESS,
  DATA_REWARDS_ADDRESS,
  EVIDENCE_REWARDS_ADDRESS,
} from "./contract";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [loading, setLoading] = useState(false);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const result = await connectWallet();
      if (result) {
        setAddress(result.address);
        setSigner(result.signer);
      }
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      alert(err.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  // Three separate contract instances — never mix them
  const userContract = useMemo(() => (signer ? getContract(signer) : null), [signer]);
  const riskContract = useMemo(
    () => (signer && RISK_MGMT_ADDRESS ? getRiskContract(signer, RISK_MGMT_ADDRESS) : null),
    [signer],
  );
  const dataRewardsContract = useMemo(
    () => (signer && DATA_REWARDS_ADDRESS ? getDataRewardsContract(signer, DATA_REWARDS_ADDRESS) : null),
    [signer],
  );
  const evidenceContract = useMemo(
    () => (signer && EVIDENCE_REWARDS_ADDRESS ? getEvidenceRewardsContract(signer, EVIDENCE_REWARDS_ADDRESS) : null),
    [signer],
  );

  return { address, signer, userContract, riskContract, dataRewardsContract, evidenceContract, loading, connect };
}
