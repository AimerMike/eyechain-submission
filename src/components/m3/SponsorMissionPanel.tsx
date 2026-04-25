import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import {
  DEPLOYER_ADDRESS,
  MOCK_USDC_ADDRESS,
  RECOVERY_MISSIONS_ADDRESS,
} from "@/lib/contract";

interface Props {
  missionContract: ethers.Contract | null;
  mockUsdcContract: ethers.Contract | null;
  address: string;
  isFuji: boolean;
  refreshKey?: number;
  onRefresh?: () => void;
}

export default function SponsorMissionPanel({
  missionContract,
  mockUsdcContract,
  address,
  isFuji,
  refreshKey,
  onRefresh,
}: Props) {
  const [missionText, setMissionText] = useState(
    "7-day recovery mission for high-myopia post-op routine tracking"
  );
  const [maxParticipants, setMaxParticipants] = useState("3");
  const [milestone1Reward, setMilestone1Reward] = useState("1.00");
  const [milestone1Text, setMilestone1Text] = useState(
    "Daily observation log submitted"
  );
  const [milestone2Reward, setMilestone2Reward] = useState("1.50");
  const [milestone2Text, setMilestone2Text] = useState(
    "Follow-up check or proof submitted"
  );

  const [allowance, setAllowance] = useState("0");
  const [message, setMessage] = useState("");
  const [lastTxHash, setLastTxHash] = useState("");
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);

  const isAdmin =
    !!address && address.toLowerCase() === DEPLOYER_ADDRESS.toLowerCase();

  const totalBudget = useMemo(() => {
    try {
      const r1 = Number(milestone1Reward || "0");
      const r2 = Number(milestone2Reward || "0");
      const mp = Number(maxParticipants || "0");
      return (r1 + r2) * mp;
    } catch {
      return 0;
    }
  }, [milestone1Reward, milestone2Reward, maxParticipants]);

  const totalBudgetBn = useMemo(() => {
    try {
      const r1 = ethers.utils.parseUnits(milestone1Reward || "0", 6);
      const r2 = ethers.utils.parseUnits(milestone2Reward || "0", 6);
      const mp = Number(maxParticipants || "0");
      return r1.add(r2).mul(mp);
    } catch {
      return ethers.BigNumber.from(0);
    }
  }, [milestone1Reward, milestone2Reward, maxParticipants]);

  const allowanceBn = useMemo(() => {
    try {
      return ethers.BigNumber.from(allowance || "0");
    } catch {
      return ethers.BigNumber.from(0);
    }
  }, [allowance]);

  const hasEnoughAllowance = allowanceBn.gte(totalBudgetBn);

  const loadAllowance = async () => {
    if (!mockUsdcContract || !address) {
      setAllowance("0");
      return;
    }
    try {
      const value = await (mockUsdcContract as any).allowance(
        address,
        RECOVERY_MISSIONS_ADDRESS
      );
      setAllowance(value?.toString?.() ?? "0");
    } catch {
      setAllowance("0");
    }
  };

  useEffect(() => {
    loadAllowance();
  }, [mockUsdcContract, address, refreshKey]);

  const handleApprove = async () => {
    setMessage("");
    setLastTxHash("");

    if (!address || !isFuji || !mockUsdcContract) {
      setMessage("Approve prerequisites not met / 授权条件未满足");
      return;
    }

    setLoadingApprove(true);
    try {
      const tx = await (mockUsdcContract as any).approve(
        RECOVERY_MISSIONS_ADDRESS,
        totalBudgetBn
      );
      setLastTxHash(tx.hash);
      setMessage("Mission funding approve submitted / mission 预算授权已提交");
      await tx.wait();
      setMessage("Approve successful / 授权成功，现在可以创建 mission");
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

  const handleCreateMission = async () => {
    setMessage("");
    setLastTxHash("");

    if (!address || !isFuji || !missionContract) {
      setMessage("Create mission prerequisites not met / 创建任务条件未满足");
      return;
    }

    if (!missionText.trim()) {
      setMessage("Mission text required / 请输入 mission 描述");
      return;
    }

    if (!hasEnoughAllowance) {
      setMessage("Allowance not enough / 授权额度不足，请先 approve");
      return;
    }

    setLoadingCreate(true);
    try {
      const missionHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(missionText.trim())
      );

      const rewardAmounts = [
        ethers.utils.parseUnits(milestone1Reward || "0", 6),
        ethers.utils.parseUnits(milestone2Reward || "0", 6),
      ];

      const milestoneHashes = [
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(milestone1Text.trim())),
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(milestone2Text.trim())),
      ];

      const tx = await (missionContract as any).createMission(
        missionHash,
        Number(maxParticipants),
        rewardAmounts,
        milestoneHashes
      );

      setLastTxHash(tx.hash);
      setMessage("Create mission submitted / 创建任务交易已提交");
      await tx.wait();
      setMessage("Mission created successfully / 任务创建成功");
      await loadAllowance();
      onRefresh?.();
    } catch (err: any) {
      setMessage(
        err?.reason ||
          err?.data?.message ||
          err?.message ||
          "Create mission failed / 创建任务失败"
      );
    } finally {
      setLoadingCreate(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
        M3 · Sponsor Mission Builder
      </p>
      <h2 className="font-heading text-2xl mt-2">Create and Fund Mission</h2>
      <p className="text-sm text-muted-foreground mt-2">
        sponsor 先给 RecoveryMissions 合约 approve 预算，再创建 mission。
        当前任何钱包都可 create mission；若你继续只用同一个测试号，它会同时扮演 sponsor / reviewer / participant。
      </p>

      <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
        <p className="font-mono text-xs">
          Admin wallet hint: {isAdmin ? "Yes / 当前也是 deployer-admin" : "No"}
        </p>
        <p className="font-mono text-xs mt-2">
          MockUSDC address: {MOCK_USDC_ADDRESS}
        </p>
        <p className="font-mono text-xs mt-1">
          RecoveryMissions address: {RECOVERY_MISSIONS_ADDRESS}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              Mission Description
            </label>
            <textarea
              rows={5}
              value={missionText}
              onChange={(e) => setMissionText(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              Max Participants
            </label>
            <input
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              Milestone 0 Text
            </label>
            <input
              value={milestone1Text}
              onChange={(e) => setMilestone1Text(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              Milestone 0 Reward (USDC)
            </label>
            <input
              value={milestone1Reward}
              onChange={(e) => setMilestone1Reward(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              Milestone 1 Text
            </label>
            <input
              value={milestone2Text}
              onChange={(e) => setMilestone2Text(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              Milestone 1 Reward (USDC)
            </label>
            <input
              value={milestone2Reward}
              onChange={(e) => setMilestone2Reward(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4 space-y-2">
        <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          Budget Preview
        </p>
        <p className="font-mono text-sm">
          Total budget: {totalBudget.toFixed(4)} USDC
        </p>
        <p className="font-mono text-sm">
          Current allowance to mission contract:{" "}
          {Number(ethers.utils.formatUnits(allowance || "0", 6)).toFixed(4)} USDC
        </p>
        <p className={`font-mono text-xs ${hasEnoughAllowance ? "text-primary" : "text-amber-400"}`}>
          {hasEnoughAllowance
            ? "Allowance is enough / 授权额度足够"
            : "Allowance not enough / 授权额度不足"}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={handleApprove}
          disabled={loadingApprove || loadingCreate || !address || !isFuji || !mockUsdcContract}
          className="py-3 rounded-lg font-mono text-sm tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
        >
          {loadingApprove ? "Approving... 授权中..." : "Approve Mission Budget 授权任务预算"}
        </button>

        <button
          onClick={handleCreateMission}
          disabled={
            loadingApprove ||
            loadingCreate ||
            !address ||
            !isFuji ||
            !missionContract ||
            !hasEnoughAllowance
          }
          className="py-3 rounded-lg font-mono text-sm tracking-widest uppercase border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
        >
          {loadingCreate ? "Creating... 创建中..." : "Create Mission 创建任务"}
        </button>
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