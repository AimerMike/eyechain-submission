import { useState } from "react";
import { ethers } from "ethers";
import DashboardPanel from "./DashboardPanel";
import { FUJI_EXPLORER } from "@/lib/contract";

interface Props {
  contract: ethers.Contract | null;
  address: string | null;
}

export default function UserRegistration({ contract, address }: Props) {
  const [vulnScore, setVulnScore] = useState(50);
  const [baselineRisk, setBaselineRisk] = useState("Medium");
  const [retinalHistory, setRetinalHistory] = useState(false);
  const [surgeryInfo, setSurgeryInfo] = useState("No");
  const [laserCount, setLaserCount] = useState(0);
  const [sharingLevel, setSharingLevel] = useState("None");
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!contract || !address) return alert("Connect wallet first");
    setLoading(true);
    try {
      const postOp = surgeryInfo !== "No";
      const tx = await contract.registerProfile(vulnScore, postOp);
      setTxHash(tx.hash);
      await tx.wait();
      alert("Registration successful!");
    } catch (err: any) {
      console.error(err);
      alert(err.reason || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-foreground font-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary";
  const inputClass = selectClass;
  const labelClass = "block font-mono text-xs text-muted-foreground tracking-wider uppercase mb-1.5";

  return (
    <DashboardPanel title="User Registration" tag="01 · Register" tagColor="cyan">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Vulnerability Score (0-100)</label>
          <input type="number" min={0} max={100} value={vulnScore} onChange={e => setVulnScore(Number(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Baseline Risk</label>
          <select value={baselineRisk} onChange={e => setBaselineRisk(e.target.value)} className={selectClass}>
            <option>Low</option><option>Medium</option><option>High</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Retinal History</label>
          <select value={retinalHistory ? "Yes" : "No"} onChange={e => setRetinalHistory(e.target.value === "Yes")} className={selectClass}>
            <option>No</option><option>Yes</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Surgery Info</label>
          <select value={surgeryInfo} onChange={e => setSurgeryInfo(e.target.value)} className={selectClass}>
            <option>No</option><option>External</option><option>Internal</option><option>ICL</option><option>LASIK</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Laser Treatment Count</label>
          <input type="number" min={0} value={laserCount} onChange={e => setLaserCount(Number(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Data Sharing Level</label>
          <select value={sharingLevel} onChange={e => setSharingLevel(e.target.value)} className={selectClass}>
            <option>None</option><option>Research</option><option>Healthcare</option><option>Public</option>
          </select>
        </div>
      </div>
      <button onClick={handleRegister} disabled={loading || !address} className="mt-5 w-full py-3 rounded-lg font-mono text-sm tracking-wider uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50">
        {loading ? "Submitting..." : "Register on Blockchain"}
      </button>
      {txHash && (
        <div className="mt-3 p-3 bg-muted rounded-lg">
          <p className="font-mono text-xs text-muted-foreground">TX Hash:</p>
          <a href={`${FUJI_EXPLORER}/tx/${txHash}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-primary break-all hover:underline">{txHash}</a>
        </div>
      )}
    </DashboardPanel>
  );
}
