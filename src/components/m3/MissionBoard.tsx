import { useEffect, useState } from "react";
import { ethers } from "ethers";

interface Props {
  missionContract: ethers.Contract | null;
  address: string;
  refreshKey?: number;
}

type MissionRow = {
  missionId: number;
  sponsor: string;
  active: boolean;
  maxParticipants: number;
  participants: number;
  totalBudget: string;
  remainingBudget: string;
  missionHash: string;
  milestoneCount: number;
  joined: boolean;
};

function shortAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortHash(value: string) {
  if (!value) return "";
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

export default function MissionBoard({
  missionContract,
  address,
  refreshKey,
}: Props) {
  const [rows, setRows] = useState<MissionRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setMessage("");

    if (!missionContract) {
      setRows([]);
      return;
    }

    setLoading(true);
    try {
      const nextMissionIdBn = await (missionContract as any).nextMissionId();
      const nextMissionId = Number(nextMissionIdBn);

      const temp: MissionRow[] = [];

      for (let i = 0; i < nextMissionId; i++) {
        try {
          const m = await (missionContract as any).missions(i);
          const milestoneCount = await (missionContract as any).milestoneCount(i);
          let joined = false;

          if (address) {
            try {
              joined = await (missionContract as any).joined(i, address);
            } catch {
              joined = false;
            }
          }

          temp.push({
            missionId: i,
            sponsor: m.sponsor,
            active: Boolean(m.active),
            maxParticipants: Number(m.maxParticipants),
            participants: Number(m.participants),
            totalBudget: m.totalBudget?.toString?.() ?? "0",
            remainingBudget: m.remainingBudget?.toString?.() ?? "0",
            missionHash: m.missionHash ?? "",
            milestoneCount: Number(milestoneCount),
            joined,
          });
        } catch {
          // skip
        }
      }

      temp.sort((a, b) => b.missionId - a.missionId);
      setRows(temp);
    } catch (err: any) {
      setMessage(
        err?.reason ||
          err?.data?.message ||
          err?.message ||
          "Failed to load missions / 读取 missions 失败"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [missionContract, address, refreshKey]);

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
        M3 · Mission Board
      </p>
      <h2 className="font-heading text-2xl mt-2">Existing Missions</h2>
      <p className="text-sm text-muted-foreground mt-2">
        这里读取 missions / milestoneCount / joined 状态。
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={load}
          disabled={loading || !missionContract}
          className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
        >
          {loading ? "Refreshing... 刷新中..." : "Refresh Missions 刷新任务"}
        </button>
        <span className="font-mono text-xs text-muted-foreground">
          Total missions: {rows.length}
        </span>
      </div>

      {message && (
        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
          <p className="font-mono text-xs break-words whitespace-pre-wrap">
            {message}
          </p>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[1150px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Mission ID
              </th>
              <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Sponsor
              </th>
              <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Active
              </th>
              <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Participants
              </th>
              <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Total Budget
              </th>
              <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Remaining Budget
              </th>
              <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Milestones
              </th>
              <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Joined By Me
              </th>
              <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Mission Hash
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.missionId} className="border-b border-border/50">
                <td className="py-3 pr-4 font-mono text-sm">{row.missionId}</td>
                <td className="py-3 pr-4 font-mono text-sm">
                  {shortAddress(row.sponsor)}
                </td>
                <td
                  className={`py-3 pr-4 font-mono text-sm ${
                    row.active ? "text-primary" : "text-destructive"
                  }`}
                >
                  {row.active ? "Active 激活" : "Inactive 关闭"}
                </td>
                <td className="py-3 pr-4 font-mono text-sm">
                  {row.participants}/{row.maxParticipants}
                </td>
                <td className="py-3 pr-4 font-mono text-sm">
                  {Number(ethers.utils.formatUnits(row.totalBudget || "0", 6)).toFixed(4)} USDC
                </td>
                <td className="py-3 pr-4 font-mono text-sm">
                  {Number(ethers.utils.formatUnits(row.remainingBudget || "0", 6)).toFixed(4)} USDC
                </td>
                <td className="py-3 pr-4 font-mono text-sm">{row.milestoneCount}</td>
                <td className="py-3 pr-4 font-mono text-sm">
                  {row.joined ? "Yes 已加入" : "No 未加入"}
                </td>
                <td className="py-3 pr-4 font-mono text-sm break-all">
                  {shortHash(row.missionHash)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}