import { useMemo, useState } from "react";
import { ethers } from "ethers";
import { DEPLOYER_ADDRESS } from "@/lib/contract";

interface Props {
  missionContract: ethers.Contract | null;
  address: string;
  isFuji: boolean;
  refreshKey?: number;
  onRefresh?: () => void;
}

function shortHash(value: string) {
  if (!value) return "";
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

export default function ReviewMissionPanel({
  missionContract,
  address,
  isFuji,
  onRefresh,
}: Props) {
  const [missionId, setMissionId] = useState("0");
  const [targetUser, setTargetUser] = useState("");
  const [milestoneIndex, setMilestoneIndex] = useState("0");

  const [proofHash, setProofHash] = useState("");
  const [approved, setApproved] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [lastTxHash, setLastTxHash] = useState("");
  const [loadingRead, setLoadingRead] = useState(false);
  const [loadingApprove, setLoadingApprove] = useState(false);

  const isAdmin =
    !!address && address.toLowerCase() === DEPLOYER_ADDRESS.toLowerCase();

  const canApprove = useMemo(() => {
    return (
      !!address &&
      !!isFuji &&
      !!missionContract &&
      !!targetUser.trim() &&
      isAdmin
    );
  }, [address, isFuji, missionContract, targetUser, isAdmin]);

  const handleReadState = async () => {
    setMessage("");
    setLastTxHash("");

    if (!missionContract || !targetUser.trim()) {
      setMessage("Mission contract and target user required / 请输入 mission contract 和用户地址");
      return;
    }

    setLoadingRead(true);
    try {
      const proof = await (missionContract as any).submittedProofs(
        Number(missionId),
        targetUser,
        Number(milestoneIndex)
      );
      const ok = await (missionContract as any).milestoneApproved(
        Number(missionId),
        targetUser,
        Number(milestoneIndex)
      );

      setProofHash(proof || "");
      setApproved(Boolean(ok));
      setMessage("Review state loaded / 审核状态已读取");
    } catch (err: any) {
      setMessage(
        err?.reason ||
          err?.data?.message ||
          err?.message ||
          "Read review state failed / 读取审核状态失败"
      );
      setProofHash("");
      setApproved(null);
    } finally {
      setLoadingRead(false);
    }
  };

  const handleApprove = async () => {
    setMessage("");
    setLastTxHash("");

    if (!canApprove) {
      setMessage("Approve prerequisites not met / 审核条件未满足");
      return;
    }

    setLoadingApprove(true);
    try {
      const tx = await (missionContract as any).approveMilestone(
        Number(missionId),
        targetUser,
        Number(milestoneIndex)
      );

      setLastTxHash(tx.hash);
      setMessage("Approve milestone submitted / 审核里程碑交易已提交");
      await tx.wait();
      setMessage("Milestone approved / 里程碑审核通过，奖励已转入 registry");
      await handleReadState();
      onRefresh?.();
    } catch (err: any) {
      setMessage(
        err?.reason ||
          err?.data?.message ||
          err?.message ||
          "Approve milestone failed / 审核失败"
      );
    } finally {
      setLoadingApprove(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
        M3 · Review and Approve
      </p>
      <h2 className="font-heading text-2xl mt-2">Reviewer / Sponsor Approval</h2>
      <p className="text-sm text-muted-foreground mt-2">
        sponsor 或拥有 REVIEWER_ROLE 的地址才能 approveMilestone。当前若你还是用 deployer 测试号，它默认就能审。
      </p>

      <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
        <p className="font-mono text-xs">
          Admin / reviewer hint: {isAdmin ? "Yes / 当前可审" : "No / 当前不是 deployer-admin"}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              Mission ID
            </label>
            <input
              value={missionId}
              onChange={(e) => setMissionId(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              Target User Address
            </label>
            <input
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3"
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              Milestone Index
            </label>
            <input
              value={milestoneIndex}
              onChange={(e) => setMilestoneIndex(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3"
              placeholder="0"
            />
          </div>

          <button
            onClick={handleReadState}
            disabled={loadingRead || loadingApprove || !missionContract}
            className="w-full py-3 rounded-lg font-mono text-sm tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            {loadingRead ? "Reading... 读取中..." : "Read Proof State 读取证明状态"}
          </button>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              Submitted Proof Hash
            </p>
            <p className="font-mono text-sm mt-2 break-all">
              {proofHash ? shortHash(proofHash) : "No proof / 暂无 proof"}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              Approved State
            </p>
            <p className="font-mono text-sm mt-2">
              {approved === null
                ? "Unknown / 未读取"
                : approved
                ? "Approved 已通过"
                : "Not approved 未通过"}
            </p>
          </div>

          <button
            onClick={handleApprove}
            disabled={loadingRead || loadingApprove || !canApprove}
            className="w-full py-3 rounded-lg font-mono text-sm tracking-widest uppercase border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
          >
            {loadingApprove ? "Approving... 审核中..." : "Approve Milestone 通过里程碑"}
          </button>
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