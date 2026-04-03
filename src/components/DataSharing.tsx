import { useState } from "react";
import DashboardPanel from "./DashboardPanel";

interface Props {
  address: string | null;
}

export default function DataSharing({ address }: Props) {
  const [shareResearch, setShareResearch] = useState(false);
  const [shareHealthcare, setShareHealthcare] = useState(false);
  const [rewardBalance, setRewardBalance] = useState(0);
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!address) return alert("Connect wallet first");
    setLoading(true);
    try {
      // Simulated sharing — in production this calls shareData() on the contract
      await new Promise(r => setTimeout(r, 1500));
      const reward = (shareResearch ? 0.001 : 0) + (shareHealthcare ? 0.001 : 0);
      setRewardBalance(prev => prev + reward);
      setShared(true);
    } catch (err: any) {
      alert(err.message || "Sharing failed");
    } finally {
      setLoading(false);
    }
  };

  const checkClass = "w-4 h-4 accent-cyan rounded";

  return (
    <DashboardPanel title="Data Sharing & Rewards" tag="04 · Share" tagColor="amber">
      <div className="space-y-3 mb-5">
        <label className="flex items-center gap-3 cursor-pointer text-foreground">
          <input type="checkbox" checked={shareResearch} onChange={e => setShareResearch(e.target.checked)} className={checkClass} />
          Share with Research Organizations
        </label>
        <label className="flex items-center gap-3 cursor-pointer text-foreground">
          <input type="checkbox" checked={shareHealthcare} onChange={e => setShareHealthcare(e.target.checked)} className={checkClass} />
          Share with Healthcare Providers
        </label>
      </div>

      <div className="bg-muted rounded-lg p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">REWARD BALANCE</p>
          <p className="font-heading text-2xl font-bold text-amber mt-1">{rewardBalance.toFixed(4)} <span className="text-sm text-muted-foreground">AVAX</span></p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-muted-foreground">STATUS</p>
          <p className={`font-mono text-sm mt-1 ${shared ? "text-neon-green" : "text-muted-foreground"}`}>
            {shared ? "✓ Data Shared" : "Not Shared"}
          </p>
        </div>
      </div>

      <button onClick={handleShare} disabled={loading || !address || (!shareResearch && !shareHealthcare)} className="w-full py-3 rounded-lg font-mono text-sm tracking-wider uppercase border border-amber/50 bg-amber/10 text-amber hover:bg-amber/20 transition-all disabled:opacity-50">
        {loading ? "Sharing..." : "Share Data & Earn Rewards"}
      </button>

      {shared && (
        <div className="mt-3 p-3 bg-neon-green/10 border border-neon-green/30 rounded-lg">
          <p className="font-mono text-xs text-neon-green">✓ Data shared successfully! Reward: +0.001 AVAX per category</p>
        </div>
      )}
    </DashboardPanel>
  );
}
