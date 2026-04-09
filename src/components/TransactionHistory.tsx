import { useEffect, useState } from "react";
import { ethers } from "ethers";
import DashboardPanel from "./DashboardPanel";
import { flagToSymptoms, hasContractMethod } from "@/lib/contract";

interface Props {
  riskContract: ethers.Contract | null;
  address: string | null;
}

interface RiskEvent {
  timestamp: number;
  accelLoad: number;
  postureLoad: number;
  durationScore: number;
  symptomsFlag: number;
  totalRisk: number;
  activityType?: string;
  simulated?: boolean;
}


export default function TransactionHistory({ riskContract, address }: Props) {
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!address) return;

    setLoading(true);
    setMessage("");

    try {
      if (riskContract && hasContractMethod(riskContract, "getUserHistory")) {
        const history = await (riskContract as any).getUserHistory(address);
        const normalized = history.map((e: any) => ({
          timestamp: Number(e.timestamp),
          accelLoad: Number(e.accelLoad),
          postureLoad: Number(e.postureLoad),
          durationScore: Number(e.durationScore),
          symptomsFlag: Number(e.symptomsFlag),
          totalRisk: Number(e.totalRisk),
          activityType: e.activityType || "",
        })).reverse();

        setEvents(normalized);
        if (normalized.length === 0) {
          setMessage("No events recorded yet / 暂无风险事件记录");
        }
        return;
      }

      // No riskContract or no getUserHistory method
      setEvents([]);
      setMessage("RiskManagement not deployed — on-chain history unavailable\nRiskManagement 合约未部署 — 链上历史不可用");
    } catch (err: any) {
      console.error("Failed to fetch history:", err);
      setEvents([]);
      setMessage("Failed to fetch on-chain history / 获取链上历史失败: " + (err.reason || err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!address) {
      setEvents([]);
      setMessage("");
      return;
    }
    fetchHistory();
  }, [riskContract, address]);

  return (
    <DashboardPanel title="Transaction History" titleCn="交易历史" tag="06 · History 历史" tagColor="cyan">
      {!address ? (
        <p className="text-muted-foreground font-mono text-sm">Connect wallet to view history<br/>连接钱包查看历史</p>
      ) : (
        <>
          {message && !events.length && (
            <div className="mb-3 p-3 bg-amber/10 border border-amber/30 rounded-lg">
              <p className="font-mono text-xs text-amber whitespace-pre-line">{message}</p>
            </div>
          )}

          {events.length === 0 ? (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-muted-foreground font-mono text-sm break-words">{message || "No events recorded yet / 暂无记录"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-mono text-xs text-muted-foreground py-2">#</th>
                    <th className="text-left font-mono text-xs text-muted-foreground py-2">TIME 时间</th>
                    <th className="text-left font-mono text-xs text-muted-foreground py-2">RISK 风险</th>
                    <th className="text-left font-mono text-xs text-muted-foreground py-2">ACCEL 加速</th>
                    <th className="text-left font-mono text-xs text-muted-foreground py-2">POSTURE 姿态</th>
                    <th className="text-left font-mono text-xs text-muted-foreground py-2">ACTIVITY 活动</th>
                    <th className="text-left font-mono text-xs text-muted-foreground py-2">SYMPTOMS 症状</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e, i) => {
                    const symptoms = flagToSymptoms(e.symptomsFlag);
                    const symList = Object.entries(symptoms).filter(([, v]) => v).map(([k]) => k);

                    return (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 text-muted-foreground font-mono">{events.length - i}{e.simulated ? " *" : ""}</td>
                        <td className="py-2 text-foreground font-mono text-xs">{new Date(e.timestamp * 1000).toLocaleString()}</td>
                        <td className="py-2">
                          <span className={`font-heading font-bold ${e.totalRisk >= 85 ? "text-destructive" : e.totalRisk >= 70 ? "text-amber" : "text-neon-green"}`}>
                            {e.totalRisk}
                          </span>
                        </td>
                        <td className="py-2 text-foreground">{e.accelLoad}</td>
                        <td className="py-2 text-foreground">{e.postureLoad}</td>
                        <td className="py-2 text-muted-foreground text-xs">{e.activityType || "—"}</td>
                        <td className="py-2 text-muted-foreground text-xs">{symList.length > 0 ? symList.join(", ") : "— 无"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <button onClick={fetchHistory} disabled={loading || !address} className="mt-4 px-4 py-2 rounded-lg font-mono text-xs tracking-wider uppercase border border-primary/50 text-primary hover:bg-primary/10 transition-all disabled:opacity-50">
            {loading ? "Loading... 加载中..." : "Refresh History 刷新历史"}
          </button>
        </>
      )}
    </DashboardPanel>
  );
}
