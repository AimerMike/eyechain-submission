import { useState, useEffect } from "react";
import { ethers } from "ethers";
import DashboardPanel from "./DashboardPanel";
import { flagToSymptoms } from "@/lib/contract";

interface Props {
  contract: ethers.Contract | null;
  address: string | null;
}

interface RiskEvent {
  timestamp: number;
  accelLoad: number;
  postureLoad: number;
  durationScore: number;
  symptomsFlag: number;
  totalRisk: number;
}

export default function HealthDataOverview({ contract, address }: Props) {
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!contract || !address) return;
    setLoading(true);
    try {
      const [prof, history] = await Promise.all([
        contract.profiles(address),
        contract.getHistory(address),
      ]);
      setProfile(prof);
      setEvents(history.map((e: any) => ({
        timestamp: Number(e.timestamp),
        accelLoad: Number(e.accelLoad),
        postureLoad: Number(e.postureLoad),
        durationScore: Number(e.durationScore),
        symptomsFlag: Number(e.symptomsFlag),
        totalRisk: Number(e.totalRisk),
      })));
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [contract, address]);

  const lastEvent = events.length > 0 ? events[events.length - 1] : null;
  const lastSymptoms = lastEvent ? flagToSymptoms(lastEvent.symptomsFlag) : null;

  return (
    <DashboardPanel title="Health Data Overview" titleCn="健康数据概览" tag="03 · Overview 概览" tagColor="green">
      {!address ? (
        <p className="text-muted-foreground font-mono text-sm">Connect wallet to view data<br/>连接钱包以查看数据</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: "VULN SCORE\n脆弱性评分", value: profile ? Number(profile.vulnerabilityScore) : "—" },
              { label: "REGISTERED\n已注册", value: profile && Number(profile.registeredAt) > 0 ? "✓ YES 是" : "✕ NO 否" },
              { label: "TOTAL EVENTS\n总事件数", value: events.length },
              { label: "LAST RISK\n最近风险", value: lastEvent ? lastEvent.totalRisk : "—" },
            ].map(s => (
              <div key={s.label} className="bg-muted rounded-lg p-4 text-center">
                <div className="font-heading text-2xl font-bold text-primary">{s.value}</div>
                <div className="font-mono text-[10px] text-muted-foreground tracking-wider mt-1 whitespace-pre-line">{s.label}</div>
              </div>
            ))}
          </div>

          {lastEvent && (
            <div className="bg-muted rounded-lg p-4 mb-4">
              <p className="font-mono text-xs text-muted-foreground mb-2">LAST EVENT DETAILS 最近事件详情</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div><span className="text-muted-foreground">Accel 加速度:</span> <span className="text-foreground">{lastEvent.accelLoad}</span></div>
                <div><span className="text-muted-foreground">Posture 姿态:</span> <span className="text-foreground">{lastEvent.postureLoad}</span></div>
                <div><span className="text-muted-foreground">Duration 持续:</span> <span className="text-foreground">{lastEvent.durationScore}</span></div>
                <div><span className="text-muted-foreground">Symptoms 症状:</span> <span className="text-foreground">
                  {lastSymptoms && Object.entries(lastSymptoms).filter(([,v]) => v).map(([k]) => k).join(", ") || "None 无"}
                </span></div>
              </div>
            </div>
          )}

          <button onClick={fetchData} disabled={loading} className="px-4 py-2 rounded-lg font-mono text-xs tracking-wider uppercase border border-neon-green/50 bg-neon-green/10 text-neon-green hover:bg-neon-green/20 transition-all disabled:opacity-50">
            {loading ? "Loading... 加载中..." : "Refresh Data 刷新数据"}
          </button>
        </>
      )}
    </DashboardPanel>
  );
}
