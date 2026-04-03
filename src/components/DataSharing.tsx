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
    if (!address) return alert("Connect wallet first / 请先连接钱包");
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const reward = (shareResearch ? 0.001 : 0) + (shareHealthcare ? 0.001 : 0);
      setRewardBalance(prev => prev + reward);
      setShared(true);
    } catch (err: any) {
      alert(err.message || "Sharing failed / 共享失败");
    } finally {
      setLoading(false);
    }
  };

  const checkClass = "w-4 h-4 accent-cyan rounded";

  return (
    <DashboardPanel title="Data Sharing & Rewards" titleCn="数据共享与奖励" tag="04 · Share 共享" tagColor="amber">
      <div className="space-y-3 mb-5">
        <label className="flex items-center gap-3 cursor-pointer text-foreground">
          <input type="checkbox" checked={shareResearch} onChange={e => setShareResearch(e.target.checked)} className={checkClass} />
          Share with Research Organizations 与研究机构共享
        </label>
        <label className="flex items-center gap-3 cursor-pointer text-foreground">
          <input type="checkbox" checked={shareHealthcare} onChange={e => setShareHealthcare(e.target.checked)} className={checkClass} />
          Share with Healthcare Providers 与医疗机构共享
        </label>
      </div>

      <div className="bg-muted rounded-lg p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">REWARD BALANCE 奖励余额</p>
          <p className="font-heading text-2xl font-bold text-amber mt-1">{rewardBalance.toFixed(4)} <span className="text-sm text-muted-foreground">AVAX</span></p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-muted-foreground">STATUS 状态</p>
          <p className={`font-mono text-sm mt-1 ${shared ? "text-neon-green" : "text-muted-foreground"}`}>
            {shared ? "✓ Shared 已共享" : "Not Shared 未共享"}
          </p>
        </div>
      </div>

      <button onClick={handleShare} disabled={loading || !address || (!shareResearch && !shareHealthcare)} className="w-full py-3 rounded-lg font-mono text-sm tracking-wider uppercase border border-amber/50 bg-amber/10 text-amber hover:bg-amber/20 transition-all disabled:opacity-50">
        {loading ? "Sharing... 共享中..." : "Share Data & Earn Rewards 共享数据赚取奖励"}
      </button>

      {shared && (
        <div className="mt-3 p-3 bg-neon-green/10 border border-neon-green/30 rounded-lg">
          <p className="font-mono text-xs text-neon-green">✓ Data shared successfully! Reward: +0.001 AVAX per category<br/>数据共享成功！每类奖励: +0.001 AVAX</p>
        </div>
      )}
    </DashboardPanel>
  );
}
