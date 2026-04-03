import { useState, useEffect } from "react";
import { ethers } from "ethers";
import DashboardPanel from "./DashboardPanel";
import { FUJI_EXPLORER, flagToSymptoms } from "@/lib/contract";

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

export default function TransactionHistory({ contract, address }: Props) {
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!contract || !address) return;
    setLoading(true);
    try {
      const history = await contract.getHistory(address);
      setEvents(history.map((e: any) => ({
        timestamp: Number(e.timestamp),
        accelLoad: Number(e.accelLoad),
        postureLoad: Number(e.postureLoad),
        durationScore: Number(e.durationScore),
        symptomsFlag: Number(e.symptomsFlag),
        totalRisk: Number(e.totalRisk),
      })).reverse());
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, [contract, address]);

  return (
    <DashboardPanel title="Transaction History" tag="06 · History" tagColor="cyan">
      {events.length === 0 ? (
        <p className="text-muted-foreground font-mono text-sm">{address ? "No events recorded yet" : "Connect wallet to view history"}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-mono text-xs text-muted-foreground py-2">#</th>
                <th className="text-left font-mono text-xs text-muted-foreground py-2">TIME</th>
                <th className="text-left font-mono text-xs text-muted-foreground py-2">RISK</th>
                <th className="text-left font-mono text-xs text-muted-foreground py-2">ACCEL</th>
                <th className="text-left font-mono text-xs text-muted-foreground py-2">POSTURE</th>
                <th className="text-left font-mono text-xs text-muted-foreground py-2">SYMPTOMS</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => {
                const symptoms = flagToSymptoms(e.symptomsFlag);
                const symList = Object.entries(symptoms).filter(([,v]) => v).map(([k]) => k);
                return (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 text-muted-foreground font-mono">{events.length - i}</td>
                    <td className="py-2 text-foreground font-mono text-xs">{new Date(e.timestamp * 1000).toLocaleString()}</td>
                    <td className="py-2">
                      <span className={`font-heading font-bold ${e.totalRisk >= 85 ? "text-destructive" : e.totalRisk >= 70 ? "text-amber" : "text-neon-green"}`}>
                        {e.totalRisk}
                      </span>
                    </td>
                    <td className="py-2 text-foreground">{e.accelLoad}</td>
                    <td className="py-2 text-foreground">{e.postureLoad}</td>
                    <td className="py-2 text-muted-foreground text-xs">{symList.length > 0 ? symList.join(", ") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <button onClick={fetchHistory} disabled={loading || !address} className="mt-4 px-4 py-2 rounded-lg font-mono text-xs tracking-wider uppercase border border-primary/50 text-primary hover:bg-primary/10 transition-all disabled:opacity-50">
        {loading ? "Loading..." : "Refresh History"}
      </button>
    </DashboardPanel>
  );
}
