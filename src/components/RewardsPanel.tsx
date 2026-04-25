import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { DEPLOYER_ADDRESS } from "@/lib/contract";

interface Props {
  contract: ethers.Contract | null;
  address: string;
  isFuji: boolean;
  refreshKey?: number;
  onRefresh?: () => void;
}

function privacyLabel(value: number) {
  if (value === 0) return "Private 完全私密";
  if (value === 1) return "Open 默认共享";
  return "Negotiable 每次询问";
}

function safeFormatEther(value: any) {
  try {
    return Number(ethers.utils.formatEther(value || "0")).toFixed(7);
  } catch {
    return "0.0000000";
  }
}

function safeFormatUnits(value: any, decimals = 18) {
  try {
    return Number(ethers.utils.formatUnits(value || "0", decimals)).toFixed(4);
  } catch {
    return "0.0000";
  }
}

function shortHash(value: string, left = 10, right = 8) {
  if (!value) return "";
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}

export default function RewardsPanel({
  contract,
  address,
  isFuji,
  refreshKey,
  onRefresh,
}: Props) {
  const [registered, setRegistered] = useState(false);
  const [privacy, setPrivacy] = useState(2);
  const [bondRefunded, setBondRefunded] = useState(false);
  const [bondDeposit, setBondDeposit] = useState("0");
  const [claimableReward, setClaimableReward] = useState("0");
  const [registeredAt, setRegisteredAt] = useState("0");
  const [evidenceIds, setEvidenceIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [lastAction, setLastAction] = useState("");
  const [lastTxHash, setLastTxHash] = useState("");
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [loadingRefund, setLoadingRefund] = useState(false);
  const [appraising, setAppraising] = useState(false);

  const [evidenceId, setEvidenceId] = useState("");
  const [qualityScore, setQualityScore] = useState("85");
  const [rewardAmount, setRewardAmount] = useState("1.25");

  const isAdmin =
    !!address && address.toLowerCase() === DEPLOYER_ADDRESS.toLowerCase();

  const canClaim = useMemo(() => {
    try {
      return Number(claimableReward || "0") > 0;
    } catch {
      return false;
    }
  }, [claimableReward]);

  const hasEvidence = evidenceIds.length > 0;

  const flowHint = useMemo(() => {
    if (!registered) {
      return "Next step: register first / 下一步：先注册";
    }
    if (!hasEvidence) {
      return "Next step: submit at least one evidence / 下一步：先提交至少一条证据";
    }
    if (canClaim) {
      return "Next step: claim reward, then refund bond if desired / 下一步：先领取奖励，再按需退还保证金";
    }
    if (isAdmin) {
      return "Admin next step: appraise one evidence with positive reward / 管理员下一步：审核一条证据并给正奖励";
    }
    return "Waiting for appraisal result / 等待审核结果";
  }, [registered, hasEvidence, canClaim, isAdmin]);

  const load = async () => {
    setMessage("");

    if (!contract || !address) return;

    try {
      const profile = await (contract as any).profiles(address);
      const ids = await (contract as any).getUserEvidenceIds(address);
      const claimable = await (contract as any).claimable(address);
      const registerBondWei = await (contract as any).registerBondWei();

      setRegistered(Boolean(profile?.registered));
      setPrivacy(Number(profile?.mode ?? 2));
      setBondRefunded(Boolean(profile?.bondRefunded));
      setRegisteredAt(profile?.registeredAt?.toString?.() ?? "0");
      setBondDeposit(registerBondWei?.toString?.() ?? "0");
      setClaimableReward(claimable?.toString?.() ?? "0");
      setEvidenceIds(ids.map((x: any) => Number(x)));
    } catch (err: any) {
      setMessage(
        err?.reason ||
          err?.data?.message ||
          err?.message ||
          "Failed to load contributor state / 读取贡献者状态失败"
      );
    }
  };

  useEffect(() => {
    load();
  }, [contract, address, refreshKey]);

  const handleClaim = async () => {
    setMessage("");
    setLastAction("");
    setLastTxHash("");

    if (!address || !isFuji || !contract) {
      setMessage("Claim prerequisites not met / 领取条件未满足");
      return;
    }

    setLoadingClaim(true);

    try {
      const tx = await (contract as any).claim();
      setLastAction("Claim Reward / 领取奖励");
      setLastTxHash(tx.hash);
      setMessage("Claim transaction submitted / 领取交易已提交");
      await tx.wait();
      setMessage(
        "Claim successful / 领取成功。You can now consider refunding bond if contribution was accepted / 如贡献已被接受，现在可继续尝试退回保证金"
      );
      await load();
      onRefresh?.();
    } catch (err: any) {
      setMessage(
        err?.reason ||
          err?.data?.message ||
          err?.message ||
          "Claim failed / 领取失败"
      );
    } finally {
      setLoadingClaim(false);
    }
  };

  const handleRefund = async () => {
    setMessage("");
    setLastAction("");
    setLastTxHash("");

    if (!address || !isFuji || !contract) {
      setMessage("Refund prerequisites not met / 退款条件未满足");
      return;
    }

    setLoadingRefund(true);

    try {
      const tx = await (contract as any).refundBond();
      setLastAction("Refund Bond / 退回保证金");
      setLastTxHash(tx.hash);
      setMessage("Refund transaction submitted / 退款交易已提交");
      await tx.wait();
      setMessage("Bond refunded / 保证金已退回");
      await load();
      onRefresh?.();
    } catch (err: any) {
      setMessage(
        err?.reason ||
          err?.data?.message ||
          err?.message ||
          "Refund failed / 退款失败"
      );
    } finally {
      setLoadingRefund(false);
    }
  };

  const handleAppraise = async () => {
    setMessage("");
    setLastAction("");
    setLastTxHash("");

    if (!isAdmin || !contract || !isFuji) {
      setMessage("Admin appraisal prerequisites not met / 管理员审核条件未满足");
      return;
    }

    if (!evidenceId.trim()) {
      setMessage("Evidence ID required / 请输入 evidenceId");
      return;
    }

    setAppraising(true);

    try {
      const amount = ethers.utils.parseUnits(rewardAmount || "1.25", 6);
      const appraisalHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(
          `score:${qualityScore};amount:${rewardAmount};evidence:${evidenceId}`
        )
      );

      const tx = await (contract as any).appraiseEvidence(
        Number(evidenceId),
        Number(qualityScore),
        amount,
        appraisalHash
      );

      setLastAction("Appraise Evidence / 审核证据");
      setLastTxHash(tx.hash);
      setMessage("Appraisal submitted / 审核交易已提交");
      await tx.wait();
      setMessage(
        "Appraisal successful / 审核成功。Next: user can claim reward, then refund bond / 下一步：用户可领取奖励，再退回保证金"
      );
      await load();
      onRefresh?.();
    } catch (err: any) {
      setMessage(
        err?.reason ||
          err?.data?.message ||
          err?.message ||
          "Appraisal failed / 审核失败"
      );
    } finally {
      setAppraising(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
        04 · Rewards & State 奖励与状态
      </p>
      <h2 className="font-heading text-2xl mt-2">Contributor State</h2>
      <p className="text-sm text-muted-foreground mt-2">
        这里按当前合约真实字段读取 profiles、claimable、getUserEvidenceIds。
      </p>

      <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
          Recommended Flow 推荐顺序
        </p>
        <p className="font-mono text-xs mt-2">
          1) Register 注册 → 2) Submit Evidence 提交证据 → 3) Admin Appraise 管理员审核 →
          4) Claim Reward 领取奖励 → 5) Refund Bond 退回保证金
        </p>
        <p className="font-mono text-xs mt-3 text-primary">{flowHint}</p>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Registration
          </p>
          <p
            className={`font-mono text-sm mt-2 ${
              registered ? "text-primary" : "text-destructive"
            }`}
          >
            {registered ? "Registered 已注册" : "Not registered 未注册"}
          </p>
          <p className="font-mono text-xs mt-2">
            Privacy: {privacyLabel(privacy)}
          </p>
          <p className="font-mono text-xs mt-1">
            Bond refunded: {bondRefunded ? "Yes 已退款" : "No 未退款"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Bond Deposit
          </p>
          <p className="font-mono text-sm mt-2">
            {safeFormatEther(bondDeposit)} AVAX
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Claimable Reward
          </p>
          <p
            className={`font-mono text-sm mt-2 ${
              canClaim ? "text-primary" : ""
            }`}
          >
            {safeFormatUnits(claimableReward, 6)}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Evidence Count
          </p>
          <p className="font-mono text-sm mt-2">{evidenceIds.length}</p>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4 md:col-span-2">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Registered At
          </p>
          <p className="font-mono text-sm mt-2 break-all">{registeredAt}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
          Evidence IDs
        </p>
        <p className="font-mono text-xs mt-2 break-words">
          {evidenceIds.length > 0
            ? evidenceIds.join(", ")
            : "No evidence yet / 暂无证据"}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={handleClaim}
          disabled={loadingClaim || !address || !isFuji || !contract || !canClaim}
          className="py-3 rounded-lg font-mono text-sm tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
        >
          {loadingClaim ? "Claiming... 领取中..." : "Claim Reward 领取奖励"}
        </button>

        <button
          onClick={handleRefund}
          disabled={loadingRefund || !address || !isFuji || !contract}
          className="py-3 rounded-lg font-mono text-sm tracking-widest uppercase border border-amber/50 bg-amber/10 text-amber hover:bg-amber/20 transition-all disabled:opacity-50"
        >
          {loadingRefund ? "Refunding... 退款中..." : "Refund Bond 退回保证金"}
        </button>
      </div>

      {isAdmin && (
        <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-5">
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
            Admin Appraisal Test 管理员审核测试
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            当前钱包等于 deployer/admin 时可见。先审核 evidence，再让用户 claim / refund。
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-mono text-xs text-muted-foreground tracking-wider uppercase mb-2">
                Evidence ID
              </label>
              <input
                value={evidenceId}
                onChange={(e) => setEvidenceId(e.target.value)}
                placeholder="例如 0"
                className="w-full rounded-lg border border-border bg-card px-4 py-3"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-muted-foreground tracking-wider uppercase mb-2">
                Quality Score
              </label>
              <input
                value={qualityScore}
                onChange={(e) => setQualityScore(e.target.value)}
                placeholder="85"
                className="w-full rounded-lg border border-border bg-card px-4 py-3"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-muted-foreground tracking-wider uppercase mb-2">
                Reward Amount (USDC 6 decimals)
              </label>
              <input
                value={rewardAmount}
                onChange={(e) => setRewardAmount(e.target.value)}
                placeholder="1.25"
                className="w-full rounded-lg border border-border bg-card px-4 py-3"
              />
            </div>
          </div>

          <button
            onClick={handleAppraise}
            disabled={appraising || !contract || !isFuji}
            className="mt-4 w-full py-3 rounded-lg font-mono text-sm tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            {appraising ? "Appraising... 审核中..." : "Appraise Evidence 审核证据"}
          </button>
        </div>
      )}

      {(message || lastTxHash) && (
        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 space-y-3">
          {lastAction && (
            <div>
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
                Last Action
              </p>
              <p className="font-mono text-xs mt-2">{lastAction}</p>
            </div>
          )}

          {message && (
            <div>
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
                Status
              </p>
              <p className="font-mono text-xs mt-2 break-words whitespace-pre-wrap">
                {message}
              </p>
            </div>
          )}

          {lastTxHash && (
            <div>
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
                TX HASH
              </p>
              <p className="font-mono text-xs mt-2 break-all">{lastTxHash}</p>
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