import { useEffect, useState } from "react";
import { ethers } from "ethers";

interface Props {
  missionContract: ethers.Contract | null;
  address: string;
  isFuji: boolean;
  refreshKey?: number;
  onRefresh?: () => void;
}

export default function MissionActionPanel({
  missionContract,
  address,
  isFuji,
  refreshKey,
  onRefresh,
}: Props) {
  const [missionId, setMissionId] = useState("0");
  const [milestoneIndex, setMilestoneIndex] = useState("0");
  const [proofText, setProofText] = useState(
    "Daily symptom log and compliance summary"
  );
  const [joined, setJoined] = useState<boolean | null>(null);

  const [message, setMessage] = useState("");
  const [lastTxHash, setLastTxHash] = useState("");
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const loadJoinedState = async () => {
    if (!missionContract || !address || !missionId.trim()) {
      setJoined(null);
      return;
    }

    try {
      const value = await (missionContract as any).joined(
        Number(missionId),
        address
      );
      setJoined(Boolean(value));
    } catch {
      setJoined(null);
    }
  };

  useEffect(() => {
    loadJoinedState();
  }, [missionContract, address, missionId, refreshKey]);

  const handleJoin = async () => {
    setMessage("");
    setLastTxHash("");

    if (!address || !isFuji || !missionContract) {
      setMessage("Join prerequisites not met / 加入任务条件未满足");
      return;
    }

    setLoadingJoin(true);
    try {
      const tx = await (missionContract as any).joinMission(Number(missionId));
      setLastTxHash(tx.hash);
      setMessage("Join mission submitted / 加入任务交易已提交");
      await tx.wait();
      setMessage("Joined mission successfully / 已成功加入任务");
      await loadJoinedState();
      onRefresh?.();
    } catch (err: any) {
      setMessage(
        err?.reason ||
          err?.data?.message ||
          err?.message ||
          "Join mission failed / 加入任务失败"
      );
    } finally {
      setLoadingJoin(false);
    }
  };

  const handleSubmitProof = async () => {
    setMessage("");
    setLastTxHash("");

    if (!address || !isFuji || !missionContract) {
      setMessage("Submit proof prerequisites not met / 提交证明条件未满足");
      return;
    }

    if (!proofText.trim()) {
      setMessage("Proof text required / 请输入 proof 描述");
      return;
    }

    setLoadingSubmit(true);
    try {
      const proofHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(proofText.trim())
      );

      const tx = await (missionContract as any).submitProof(
        Number(missionId),
        Number(milestoneIndex),
        proofHash
      );
      setLastTxHash(tx.hash);
      setMessage("Proof submitted / 证明交易已提交");
      await tx.wait();
      setMessage("Proof submitted successfully / 证明提交成功");
      onRefresh?.();
    } catch (err: any) {
      setMessage(
        err?.reason ||
          err?.data?.message ||
          err?.message ||
          "Submit proof failed / 提交证明失败"
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
        M3 · Participant Actions
      </p>
      <h2 className="font-heading text-2xl mt-2">Join Mission and Submit Proof</h2>
      <p className="text-sm text-muted-foreground mt-2">
        参与者必须先 join mission，再 submit proof。合约会检查你是否已在 registry 注册。
      </p>

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
              placeholder="例如 0"
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              Joined Status
            </p>
            <p className="font-mono text-sm mt-2">
              {joined === null
                ? "Unknown / 未读取"
                : joined
                ? "Joined 已加入"
                : "Not joined 未加入"}
            </p>
          </div>

          <button
            onClick={handleJoin}
            disabled={loadingJoin || loadingSubmit || !address || !isFuji || !missionContract}
            className="w-full py-3 rounded-lg font-mono text-sm tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            {loadingJoin ? "Joining... 加入中..." : "Join Mission 加入任务"}
          </button>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              Milestone Index
            </label>
            <input
              value={milestoneIndex}
              onChange={(e) => setMilestoneIndex(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3"
              placeholder="例如 0"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              Proof Description
            </label>
            <textarea
              rows={5}
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-4 py-3"
            />
          </div>

          <button
            onClick={handleSubmitProof}
            disabled={loadingJoin || loadingSubmit || !address || !isFuji || !missionContract}
            className="w-full py-3 rounded-lg font-mono text-sm tracking-widest uppercase border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
          >
            {loadingSubmit ? "Submitting... 提交中..." : "Submit Proof 提交证明"}
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