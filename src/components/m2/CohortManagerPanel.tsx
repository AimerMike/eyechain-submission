// src/components/m2/CohortManagerPanel.tsx
import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { DEPLOYER_ADDRESS } from "@/lib/contract";

interface Props {
  cohortContract: ethers.Contract | null;
  address: string;
  isFuji: boolean;
  refreshKey?: number;
  onRefresh?: () => void;
}

type CohortRow = {
  cohortId: number;
  active: boolean;
  pricePerLicense: string;
  minQualityScore: number;
  descriptorHash: string;
  createdAt: string;
  evidenceIds: number[];
};

function shortHash(value: string) {
  if (!value) return "";
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function safeFormatUnits(value: any, decimals = 6) {
  try {
    return Number(ethers.utils.formatUnits(value || "0", decimals)).toFixed(4);
  } catch {
    return "0.0000";
  }
}

export default function CohortManagerPanel({
  cohortContract,
  address,
  isFuji,
  refreshKey,
  onRefresh,
}: Props) {
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [lastTxHash, setLastTxHash] = useState("");

  const [descriptorText, setDescriptorText] = useState(
    "High-myopia retina cohort v1"
  );
  const [pricePerLicense, setPricePerLicense] = useState("5");
  const [minQualityScore, setMinQualityScore] = useState("70");

  const [targetCohortId, setTargetCohortId] = useState("0");
  const [targetEvidenceId, setTargetEvidenceId] = useState("");

  const isAdmin =
    !!address && address.toLowerCase() === DEPLOYER_ADDRESS.toLowerCase();

  const load = async () => {
    setMessage("");

    if (!cohortContract) {
      setCohorts([]);
      return;
    }

    setLoading(true);
    try {
      const nextCohortIdBn = await (cohortContract as any).nextCohortId();
      const nextCohortId = Number(nextCohortIdBn);
      const temp: CohortRow[] = [];

      for (let i = 0; i < nextCohortId; i++) {
        try {
          const cohort = await (cohortContract as any).cohorts(i);
          const evidenceIds = await (cohortContract as any).cohortEvidenceIds(i);

          temp.push({
            cohortId: i,
            active: Boolean(cohort.active),
            pricePerLicense: cohort.pricePerLicense?.toString?.() ?? "0",
            minQualityScore: Number(cohort.minQualityScore ?? 0),
            descriptorHash: cohort.descriptorHash ?? "",
            createdAt: cohort.createdAt?.toString?.() ?? "0",
            evidenceIds: evidenceIds.map((x: any) => Number(x)),
          });
        } catch {
          // skip
        }
      }

      temp.sort((a, b) => b.cohortId - a.cohortId);
      setCohorts(temp);

      if (temp.length > 0 && !temp.some((x) => String(x.cohortId) === targetCohortId)) {
        setTargetCohortId(String(temp[0].cohortId));
      }
    } catch (err: any) {
      setMessage(
        err?.reason ||
          err?.data?.message ||
          err?.message ||
          "Failed to load cohorts / 读取 cohort 失败"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [cohortContract, refreshKey]);

  const managerRoleHint = useMemo(() => {
    if (!address) return "Connect wallet first / 先连接钱包";
    if (!isFuji) return "Switch to Fuji / 切到 Fuji";
    if (!isAdmin)
      return "Current wallet is not deployer/admin / 当前钱包不是 deployer/admin";
    return "Admin mode ready / 管理员模式就绪";
  }, [address, isFuji, isAdmin]);

  const handleCreateCohort = async () => {
    setMessage("");
    setLastTxHash("");

    if (!address || !isFuji || !cohortContract || !isAdmin) {
      setMessage("Create cohort prerequisites not met / 创建 cohort 条件未满足");
      return;
    }

    if (!descriptorText.trim()) {
      setMessage("Descriptor text required / 请输入 cohort 描述");
      return;
    }

    setLoading(true);
    try {
      const descriptorHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(descriptorText.trim())
      );

      const price = ethers.utils.parseUnits(pricePerLicense || "0", 6);

      const tx = await (cohortContract as any).createCohort(
        descriptorHash,
        price,
        Number(minQualityScore)
      );

      setLastTxHash(tx.hash);
      setMessage("Create cohort submitted / 创建 cohort 交易已提交");
      await tx.wait();
      setMessage("Cohort created successfully / cohort 创建成功");
      await load();
      onRefresh?.();
    } catch (err: any) {
      setMessage(
        err?.reason ||
          err?.data?.message ||
          err?.message ||
          "Create cohort failed / 创建 cohort 失败"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvidence = async () => {
    setMessage("");
    setLastTxHash("");

    if (!address || !isFuji || !cohortContract || !isAdmin) {
      setMessage("Add evidence prerequisites not met / 入组条件未满足");
      return;
    }

    if (!targetEvidenceId.trim()) {
      setMessage("Evidence ID required / 请输入 evidence id");
      return;
    }

    setLoading(true);
    try {
      const tx = await (cohortContract as any).addEvidenceToCohort(
        Number(targetCohortId),
        Number(targetEvidenceId)
      );

      setLastTxHash(tx.hash);
      setMessage("Add evidence submitted / 入组交易已提交");
      await tx.wait();
      setMessage("Evidence added to cohort / evidence 已加入 cohort");
      setTargetEvidenceId("");
      await load();
      onRefresh?.();
    } catch (err: any) {
      setMessage(
        err?.reason ||
          err?.data?.message ||
          err?.message ||
          "Add evidence failed / evidence 入组失败"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
        M2 · Admin Cohort Manager 管理员分组器
      </p>
      <h2 className="font-heading text-2xl mt-2">Cohort Listing Manager</h2>
      <p className="text-sm text-muted-foreground mt-2">{managerRoleHint}</p>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={load}
          disabled={loading || !cohortContract}
          className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
        >
          {loading ? "Refreshing... 刷新中..." : "Refresh Cohorts 刷新 Cohorts"}
        </button>
        <span className="font-mono text-xs text-muted-foreground">
          Total cohorts: {cohorts.length}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-muted/40 p-5 space-y-4">
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
            Create Cohort 新建 cohort
          </p>

          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              Descriptor Text
            </label>
            <textarea
              rows={4}
              value={descriptorText}
              onChange={(e) => setDescriptorText(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3"
              placeholder="例如：high myopia retina follow-up cohort for longitudinal research"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                Price Per License
              </label>
              <input
                value={pricePerLicense}
                onChange={(e) => setPricePerLicense(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-3"
                placeholder="5"
              />
              <p className="font-mono text-[10px] mt-2 text-muted-foreground">
                单位按 MockUSDC 6 decimals，例如 5 = 5 USDC
              </p>
            </div>

            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                Min Quality Score
              </label>
              <input
                value={minQualityScore}
                onChange={(e) => setMinQualityScore(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-3"
                placeholder="70"
              />
            </div>
          </div>

          <button
            onClick={handleCreateCohort}
            disabled={loading || !address || !isFuji || !cohortContract || !isAdmin}
            className="w-full py-3 rounded-lg font-mono text-sm tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            {loading ? "Processing... 处理中..." : "Create Cohort 创建 Cohort"}
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-muted/40 p-5 space-y-4">
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
            Add Evidence To Cohort 加证据入组
          </p>

          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              Target Cohort
            </label>
            <select
              value={targetCohortId}
              onChange={(e) => setTargetCohortId(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3"
            >
              {cohorts.length === 0 ? (
                <option value="0">No cohort yet / 还没有 cohort</option>
              ) : (
                cohorts.map((item) => (
                  <option key={item.cohortId} value={item.cohortId}>
                    Cohort #{item.cohortId} · minQ {item.minQualityScore} · evidence{" "}
                    {item.evidenceIds.length}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              Evidence ID
            </label>
            <input
              value={targetEvidenceId}
              onChange={(e) => setTargetEvidenceId(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3"
              placeholder="例如 0"
            />
            <p className="font-mono text-[10px] mt-2 text-muted-foreground">
              只有 shared + appraised 且 quality ≥ minQuality 的 evidence 才能入组
            </p>
          </div>

          <button
            onClick={handleAddEvidence}
            disabled={
              loading ||
              !address ||
              !isFuji ||
              !cohortContract ||
              !isAdmin ||
              cohorts.length === 0
            }
            className="w-full py-3 rounded-lg font-mono text-sm tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            {loading ? "Processing... 处理中..." : "Add Evidence 入组 Evidence"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-5">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
          Existing Cohorts 当前 Cohorts
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Cohort ID
                </th>
                <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Active
                </th>
                <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Price
                </th>
                <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Min Quality
                </th>
                <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Descriptor
                </th>
                <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Evidence IDs
                </th>
                <th className="text-left py-3 pr-4 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Created At
                </th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((row) => (
                <tr key={row.cohortId} className="border-b border-border/50">
                  <td className="py-3 pr-4 font-mono text-sm">{row.cohortId}</td>
                  <td
                    className={`py-3 pr-4 font-mono text-sm ${
                      row.active ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {row.active ? "Active 激活" : "Inactive 未激活"}
                  </td>
                  <td className="py-3 pr-4 font-mono text-sm">
                    {safeFormatUnits(row.pricePerLicense, 6)} USDC
                  </td>
                  <td className="py-3 pr-4 font-mono text-sm">
                    {row.minQualityScore}
                  </td>
                  <td className="py-3 pr-4 font-mono text-sm break-all">
                    {shortHash(row.descriptorHash)}
                  </td>
                  <td className="py-3 pr-4 font-mono text-sm break-all">
                    {row.evidenceIds.length > 0
                      ? row.evidenceIds.join(", ")
                      : "Empty 空"}
                  </td>
                  <td className="py-3 pr-4 font-mono text-sm break-all">
                    {row.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(message || lastTxHash) && (
        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          {message && (
            <p className="font-mono text-xs break-words whitespace-pre-wrap">
              {message}
            </p>
          )}
          {lastTxHash && (
            <div>
              <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                TX HASH
              </p>
              <p className="font-mono text-xs break-all mt-2">{lastTxHash}</p>
              <a
                href={`https://testnet.snowtrace.io/tx/${lastTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-2 font-mono text-xs text-primary underline underline-offset-4"
              >
                Open on Snowtrace / 去 Snowtrace 查看
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  );
}