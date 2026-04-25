// src/components/m2/CohortPurchasePanel.tsx
import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import {
  COHORT_EXCHANGE_ADDRESS,
  MOCK_USDC_ADDRESS,
} from "@/lib/contract";

interface Props {
  cohortContract: ethers.Contract | null;
  mockUsdcContract: ethers.Contract | null;
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

function safeFormatUnits(value: any, decimals = 6) {
  try {
    return Number(ethers.utils.formatUnits(value || "0", decimals)).toFixed(4);
  } catch {
    return "0.0000";
  }
}

function shortHash(value: string) {
  if (!value) return "";
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

export default function CohortPurchasePanel({
  cohortContract,
  mockUsdcContract,
  address,
  isFuji,
  refreshKey,
  onRefresh,
}: Props) {
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState("");
  const [useCaseText, setUseCaseText] = useState("Retina research pilot");
  const [allowance, setAllowance] = useState("0");
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const [message, setMessage] = useState("");
  const [lastTxHash, setLastTxHash] = useState("");

  const loadCohorts = async () => {
    setMessage("");

    if (!cohortContract) {
      setCohorts([]);
      return;
    }

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
          // skip broken ids
        }
      }

      temp.sort((a, b) => a.cohortId - b.cohortId);
      setCohorts(temp);

      if (temp.length > 0) {
        const hasCurrent = temp.some(
          (item) => String(item.cohortId) === String(selectedCohortId)
        );
        if (!hasCurrent) {
          setSelectedCohortId(String(temp[0].cohortId));
        }
      } else {
        setSelectedCohortId("");
      }
    } catch (err: any) {
      setMessage(
        err?.reason ||
          err?.data?.message ||
          err?.message ||
          "Failed to load purchasable cohorts / 读取可购买 cohort 失败"
      );
    }
  };

  const loadAllowance = async () => {
    if (!mockUsdcContract || !address) {
      setAllowance("0");
      return;
    }

    try {
      const value = await (mockUsdcContract as any).allowance(
        address,
        COHORT_EXCHANGE_ADDRESS
      );
      setAllowance(value?.toString?.() ?? "0");
    } catch {
      setAllowance("0");
    }
  };

  useEffect(() => {
    loadCohorts();
  }, [cohortContract, refreshKey]);

  useEffect(() => {
    loadAllowance();
  }, [mockUsdcContract, address, refreshKey]);

  const selected = cohorts.find(
    (item) => String(item.cohortId) === String(selectedCohortId)
  );

  const selectedPriceBn = useMemo(() => {
    try {
      return ethers.BigNumber.from(selected?.pricePerLicense ?? "0");
    } catch {
      return ethers.BigNumber.from(0);
    }
  }, [selected]);

  const allowanceBn = useMemo(() => {
    try {
      return ethers.BigNumber.from(allowance || "0");
    } catch {
      return ethers.BigNumber.from(0);
    }
  }, [allowance]);
  // 判断授权是否足够
// 判断授权是否足够
const hasEnoughAllowance = useMemo(() => {
    try {
        // 确保 allowance 和 selectedPriceBn 都是 BigNumber 类型进行比较
        return ethers.BigNumber.from(allowance || "0").gte(selectedPriceBn);
    } catch {
        return false;
    }
}, [allowance, selectedPriceBn]);


const isEmptyCohort = !!selected && selected.evidenceIds.length === 0;
const isInactive = !!selected && !selected.active;

// 确保购买按钮只有在以下条件下启用：
// 1. 选择的 cohort 不是空的
// 2. 选择的 cohort 是活动的
// 3. allowance 足够
// 4. 用户有地址且处于 Fuji 网络
const canPurchase =
    !!selected &&
    !isEmptyCohort &&
    !isInactive &&
    hasEnoughAllowance &&
    !!address &&
    !!isFuji &&
    !!cohortContract;

  const handleApprove = async () => {
    setMessage("");
    setLastTxHash("");

    if (!address || !isFuji || !mockUsdcContract || !selected) {
      setMessage("Approve prerequisites not met / 授权条件未满足");
      return;
    }

    if (isInactive) {
      setMessage("Selected cohort is inactive / 当前 cohort 未激活");
      return;
    }

    if (isEmptyCohort) {
      setMessage("Selected cohort is empty / 当前 cohort 还是空的");
      return;
    }

    setLoadingApprove(true);
    try {
      const tx = await (mockUsdcContract as any).approve(
        COHORT_EXCHANGE_ADDRESS,
        selected.pricePerLicense
      );
      setLastTxHash(tx.hash);
      setMessage("Approve submitted / 授权交易已提交");
      await tx.wait();
      setMessage("Approve successful / 授权成功，现在可以购买 license");
      await loadAllowance();
      onRefresh?.();
    } catch (err: any) {
      setMessage(
        err?.reason ||
          err?.data?.message ||
          err?.message ||
          "Approve failed / 授权失败"
      );
    } finally {
      setLoadingApprove(false);
    }
  };

const handlePurchase = async () => {
    setMessage("");
    setLastTxHash("");

    if (!address || !isFuji || !cohortContract || !selected) {
        setMessage("Purchase prerequisites not met / 购买条件未满足");
        return;
    }

    if (isInactive) {
        setMessage("Selected cohort is inactive / 当前 cohort 未激活");
        return;
    }

    if (isEmptyCohort) {
        setMessage("Selected cohort is empty / 当前 cohort 还是空的");
        return;
    }

    if (!hasEnoughAllowance) {
        setMessage("Allowance not enough / 授权额度不足，请先 approve");
        return;
    }

    setLoadingPurchase(true);
    try {
        const useCaseHash = ethers.utils.keccak256(
            ethers.utils.toUtf8Bytes(useCaseText.trim() || "default use case")
        );

        const tx = await (cohortContract as any).purchaseLicense(
            Number(selectedCohortId),
            useCaseHash
        );
        setLastTxHash(tx.hash);
        setMessage("Purchase submitted / 购买交易已提交");
        await tx.wait();
        setMessage("Purchase successful / 购买成功");
        await loadAllowance();
        onRefresh?.();
    } catch (err: any) {
        setMessage(
            err?.reason ||
            err?.data?.message ||
            err?.message ||
            "Purchase failed / 购买失败"
        );
    } finally {
        setLoadingPurchase(false);
    }
};

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
        M2 · Buyer Panel 购买侧
      </p>
      <h2 className="font-heading text-2xl mt-2">Purchase Cohort License</h2>
      <p className="text-sm text-muted-foreground mt-2">
        先选一个非空 cohort，再 approve MockUSDC 给 exchange，最后 purchaseLicense。
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            Select Cohort
          </label>
          <select
            value={selectedCohortId}
            onChange={(e) => setSelectedCohortId(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted px-4 py-3"
          >
            {cohorts.length === 0 ? (
              <option value="">No cohort yet / 还没有 cohort</option>
            ) : (
              cohorts.map((item) => (
                <option key={item.cohortId} value={item.cohortId}>
                  Cohort #{item.cohortId} · {safeFormatUnits(item.pricePerLicense, 6)} USDC · evidence {item.evidenceIds.length}
                </option>
              ))
            )}
          </select>
        </div>

        {selected && (
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
            <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              Selected Cohort
            </p>
            <p className="font-mono text-sm">Cohort #{selected.cohortId}</p>
            <p className="font-mono text-sm">
              Price: {safeFormatUnits(selected.pricePerLicense, 6)} USDC
            </p>
            <p className="font-mono text-sm">
              Min quality: {selected.minQualityScore}
            </p>
            <p className="font-mono text-sm break-all">
              Descriptor: {shortHash(selected.descriptorHash)}
            </p>
            <p className="font-mono text-sm">
              Evidence count: {selected.evidenceIds.length}
            </p>
            <p
              className={`font-mono text-xs ${
                isInactive || isEmptyCohort
                  ? "text-amber-400"
                  : "text-primary"
              }`}
            >
              {isInactive
                ? "Status: inactive / 未激活"
                : isEmptyCohort
                ? "Status: empty cohort / 空 cohort，先加 evidence"
                : "Status: purchasable / 可购买"}
            </p>
          </div>
        )}

        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Current Allowance to Exchange
          </p>
          <p className="font-mono text-sm mt-2">
            {safeFormatUnits(allowance, 6)} USDC
          </p>
          <p className="font-mono text-xs mt-2 text-muted-foreground">
            MockUSDC: {MOCK_USDC_ADDRESS}
          </p>
          <p className="font-mono text-xs mt-1 text-muted-foreground">
            Exchange: {COHORT_EXCHANGE_ADDRESS}
          </p>
        </div>

        <div>
          <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            Use Case Description
          </label>
          <textarea
            rows={4}
            value={useCaseText}
            onChange={(e) => setUseCaseText(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted px-4 py-3"
            placeholder="例如：retina longitudinal study / insurance research / academic pilot..."
          />
        </div>

        {!selected && (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="font-mono text-xs text-amber-400">
              No cohort selected / 还没有选中 cohort
            </p>
          </div>
        )}

        {selected && isEmptyCohort && (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="font-mono text-xs text-amber-400">
              This cohort is empty / 当前 cohort 为空。先让管理员 add evidence。
            </p>
          </div>
        )}

        {selected && isInactive && (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="font-mono text-xs text-amber-400">
              This cohort is inactive / 当前 cohort 未激活，不能购买。
            </p>
          </div>
        )}

        {selected && !isEmptyCohort && !isInactive && !hasEnoughAllowance && (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="font-mono text-xs text-amber-400">
              Allowance not enough / 授权额度不足。先点 Approve，再点 Purchase。
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleApprove}
            disabled={
              loadingApprove ||
              loadingPurchase ||
              !address ||
              !isFuji ||
              !mockUsdcContract ||
              !selected ||
              isEmptyCohort ||
              isInactive
            }
            className="py-3 rounded-lg font-mono text-sm tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            {loadingApprove
              ? "Approving... 授权中..."
              : "Approve MockUSDC 授权 USDC"}
          </button>

          <button
            onClick={handlePurchase}
            disabled={loadingApprove || loadingPurchase || !canPurchase}
            className="py-3 rounded-lg font-mono text-sm tracking-widest uppercase border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
          >
            {loadingPurchase
              ? "Purchasing... 购买中..."
              : "Purchase License 购买许可"}
          </button>
        </div>

        {(message || lastTxHash) && (
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
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
      </div>
    </section>
  );
}