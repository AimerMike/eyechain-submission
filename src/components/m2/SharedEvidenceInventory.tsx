// src/components/m2/SharedEvidenceInventory.tsx
import { useEffect, useState } from "react";
import { ethers } from "ethers";

interface Props {
  evidenceContract: ethers.Contract | null;
  refreshKey?: number;
}

type EvidenceMeta = {
  evidenceId: number;
  owner: string;
  shared: boolean;
  appraised: boolean;
  qualityScore: number;
  dataClass: number;
};

function shortAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function dataClassLabel(value: number) {
  if (value === 0) return "Subjective Monthly 主观月度";
  if (value === 1) return "Exam Report 检查报告";
  if (value === 2) return "Inspection Report 检验报告";
  if (value === 3) return "Minor Surgery 小手术";
  if (value === 4) return "Major Surgery 大手术";
  return `Unknown (${value})`;
}

export default function SharedEvidenceInventory({
  evidenceContract,
  refreshKey,
}: Props) {
  const [rows, setRows] = useState<EvidenceMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    setMessage("");

    if (!evidenceContract) {
      setRows([]);
      return;
    }

    setLoading(true);
    try {
      const nextEvidenceIdBn = await (evidenceContract as any).nextEvidenceId();
      const nextEvidenceId = Number(nextEvidenceIdBn);

      const temp: EvidenceMeta[] = [];

      for (let i = 0; i < nextEvidenceId; i++) {
        try {
          const [owner, shared, appraised, qualityScore, dataClass] =
            await (evidenceContract as any).getEvidenceMeta(i);

          temp.push({
            evidenceId: i,
            owner,
            shared,
            appraised,
            qualityScore: Number(qualityScore),
            dataClass: Number(dataClass),
          });
        } catch {
          // skip invalid ids
        }
      }

      temp.sort((a, b) => b.evidenceId - a.evidenceId);
      setRows(temp);
    } catch (err: any) {
      setMessage(
        err?.reason ||
          err?.data?.message ||
          err?.message ||
          "Failed to load evidence inventory / 读取证据清单失败"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [evidenceContract, refreshKey]);

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
        M2 · Shared Evidence Inventory 共享证据库存
      </p>
      <h2 className="font-heading text-2xl mt-2">Evidence Inventory</h2>
      <p className="text-sm text-muted-foreground mt-2">
        这里读取 EvidenceRewards.nextEvidenceId + getEvidenceMeta。
        绿色只表示“已共享且已审核”，真正能否入组还要再看 cohort 的 min quality。
      </p>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={load}
          disabled={loading || !evidenceContract}
          className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
        >
          {loading ? "Refreshing... 刷新中..." : "Refresh Inventory 刷新库存"}
        </button>
        <span className="font-mono text-xs text-muted-foreground">
          Total loaded: {rows.length}
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
        <table className="w-full min-w-[960px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Evidence ID
              </th>
              <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Owner
              </th>
              <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Shared
              </th>
              <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Appraised
              </th>
              <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Quality
              </th>
              <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Data Class
              </th>
              <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Base Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const baseReady = row.shared && row.appraised;

              return (
                <tr key={row.evidenceId} className="border-b border-border/50">
                  <td className="py-3 pr-4 font-mono text-sm">{row.evidenceId}</td>
                  <td className="py-3 pr-4 font-mono text-sm">
                    {shortAddress(row.owner)}
                  </td>
                  <td className="py-3 pr-4 font-mono text-sm">
                    {row.shared ? "Yes 已共享" : "No 私有"}
                  </td>
                  <td className="py-3 pr-4 font-mono text-sm">
                    {row.appraised ? "Yes 已审核" : "No 未审核"}
                  </td>
                  <td className="py-3 pr-4 font-mono text-sm">
                    {row.qualityScore}
                  </td>
                  <td className="py-3 pr-4 font-mono text-sm">
                    {dataClassLabel(row.dataClass)}
                  </td>
                  <td
                    className={`py-3 pr-4 font-mono text-sm ${
                      baseReady ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {baseReady
                      ? "Shared + Appraised 可候选"
                      : "Not ready 未达条件"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}