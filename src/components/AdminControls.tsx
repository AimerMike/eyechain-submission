import { useState } from "react";
import { ethers } from "ethers";
import DashboardPanel from "./DashboardPanel";

interface Props {
  contract: ethers.Contract | null;
  address: string | null;
}

export default function AdminControls({ contract, address }: Props) {
  const [alertThresh, setAlertThresh] = useState(700);
  const [criticalThresh, setCriticalThresh] = useState(850);
  const [loading, setLoading] = useState(false);

  const handleRecalibrate = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.recalibrate(alertThresh, criticalThresh);
      await tx.wait();
      alert("Thresholds updated successfully!");
    } catch (err: any) {
      alert(err.reason || err.message || "Failed — you may not have DAO_ROLE");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-foreground font-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary";
  const labelClass = "block font-mono text-xs text-muted-foreground tracking-wider uppercase mb-1.5";

  return (
    <DashboardPanel title="Admin / DAO Controls" tag="07 · Admin" tagColor="magenta">
      <p className="text-muted-foreground text-sm mb-4 font-mono">Requires DAO_ROLE on the smart contract</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>Alert Threshold</label>
          <input type="number" value={alertThresh} onChange={e => setAlertThresh(Number(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Critical Threshold</label>
          <input type="number" value={criticalThresh} onChange={e => setCriticalThresh(Number(e.target.value))} className={inputClass} />
        </div>
      </div>
      <button onClick={handleRecalibrate} disabled={loading || !address} className="w-full py-3 rounded-lg font-mono text-sm tracking-wider uppercase border border-magenta/50 bg-magenta/10 text-magenta hover:bg-magenta/20 transition-all disabled:opacity-50">
        {loading ? "Updating..." : "Update Thresholds (DAO)"}
      </button>
    </DashboardPanel>
  );
}
