import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import DashboardPanel from "./DashboardPanel";
import { hasContractMethod, FUJI_EXPLORER } from "@/lib/contract";
import { motion } from "framer-motion";
import { Shield, Upload, CheckCircle, AlertTriangle, Clock, Coins, Lock, Unlock, HelpCircle, FileText } from "lucide-react";

interface Props {
  address: string | null;
  evidenceContract: ethers.Contract | null;
}

type PrivacyMode = "PRIVATE" | "OPEN" | "NEGOTIABLE";
type DataClass = "SUBJECTIVE_MONTHLY" | "EXAM_REPORT" | "INSPECTION_REPORT" | "MINOR_SURGERY" | "MAJOR_SURGERY";
type AppraisalStatus = "PENDING" | "APPROVED" | "REJECTED";

const PRIVACY_OPTIONS: { value: PrivacyMode; label: string; labelCn: string; icon: React.ReactNode; desc: string; descCn: string }[] = [
  { value: "PRIVATE", label: "Private", labelCn: "完全私密", icon: <Lock className="w-4 h-4" />, desc: "Data never shared", descCn: "数据永不共享" },
  { value: "OPEN", label: "Open", labelCn: "默认共享", icon: <Unlock className="w-4 h-4" />, desc: "Auto-share all uploads", descCn: "自动共享所有上传" },
  { value: "NEGOTIABLE", label: "Negotiable", labelCn: "每次询问", icon: <HelpCircle className="w-4 h-4" />, desc: "Ask per upload", descCn: "每次上传时询问" },
];

const DATA_CLASS_OPTIONS: { value: DataClass; label: string; labelCn: string; rewardRange: string }[] = [
  { value: "SUBJECTIVE_MONTHLY", label: "Subjective/Monthly Report", labelCn: "主观/月度报告", rewardRange: "0.1–1.0 USD" },
  { value: "EXAM_REPORT", label: "Eye Exam Report", labelCn: "眼科检查报告", rewardRange: "0.5–2.0 USD" },
  { value: "INSPECTION_REPORT", label: "Inspection Report", labelCn: "检验报告", rewardRange: "0.5–2.0 USD" },
  { value: "MINOR_SURGERY", label: "Minor Eye Procedure", labelCn: "眼科小手术", rewardRange: "0.5–2.0 USD" },
  { value: "MAJOR_SURGERY", label: "Major Eye Surgery", labelCn: "眼科大手术", rewardRange: "0.5–2.0 USD" },
];

const SCOPE_LABELS = [
  "Retina 视网膜", "High Myopia 高度近视", "Glaucoma 青光眼", "Cataract 白内障",
];

const PRIVACY_CODE: Record<PrivacyMode, number> = { PRIVATE: 0, OPEN: 1, NEGOTIABLE: 2 };
const DATA_CLASS_CODE: Record<DataClass, number> = { SUBJECTIVE_MONTHLY: 0, EXAM_REPORT: 1, INSPECTION_REPORT: 2, MINOR_SURGERY: 3, MAJOR_SURGERY: 4 };

interface LocalEvidence {
  id: number;
  dataClass: DataClass;
  contentHash: string;
  status: AppraisalStatus;
  rewardUsd: number;
  submittedAt: number;
}

const stagger = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.15, duration: 0.4, ease: "easeOut" } }),
};

export default function EvidenceRewards({ address, evidenceContract }: Props) {
  const [privacy, setPrivacy] = useState<PrivacyMode>("OPEN");
  const [dataClass, setDataClass] = useState<DataClass>("EXAM_REPORT");
  const [metadataNote, setMetadataNote] = useState("");
  const [shareConsent, setShareConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [txHash, setTxHash] = useState("");
  const [evidenceList, setEvidenceList] = useState<LocalEvidence[]>([]);
  const [claimable, setClaimable] = useState(0);
  const [totalClaimed, setTotalClaimed] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [privacyUpdating, setPrivacyUpdating] = useState(false);

  const contractLive = Boolean(evidenceContract && hasContractMethod(evidenceContract, "register"));

  // Check registration on mount
  useEffect(() => {
    if (!contractLive || !address || !evidenceContract) return;
    (async () => {
      try {
        const c = await (evidenceContract as any).contributors(address);
        setIsRegistered(c.registered);
        if (c.registered) {
          setPrivacy(["PRIVATE", "OPEN", "NEGOTIABLE"][Number(c.privacy)] as PrivacyMode);
          setClaimable(parseFloat(ethers.utils.formatEther(c.claimableReward)));
          setTotalClaimed(parseFloat(ethers.utils.formatEther(c.totalClaimed)));
        }
      } catch { /* not registered */ }
    })();
  }, [contractLive, address, evidenceContract]);

  // ── Register ──
  const handleRegister = async () => {
    if (!address) return;
    setRegistering(true);
    setFeedback(null);
    try {
      if (contractLive && evidenceContract) {
        const tx = await (evidenceContract as any).register(PRIVACY_CODE[privacy], { value: ethers.utils.parseEther("0.005") });
        setTxHash(tx.hash);
        await tx.wait();
        setIsRegistered(true);
        setFeedback({ type: "success", message: "Registered as contributor! Bond deposited.\n已注册为贡献者！保证金已缴纳。" });
      } else {
        // Simulation
        await new Promise(r => setTimeout(r, 1000));
        setIsRegistered(true);
        setFeedback({ type: "success", message: "[Simulation] Registered locally. Deploy EvidenceRewards contract for on-chain registration.\n[模拟] 本地注册完成。部署 EvidenceRewards 合约以进行链上注册。" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.reason || err.message || "Registration failed 注册失败" });
    } finally {
      setRegistering(false);
    }
  };

  // ── Change Privacy ──
  const handlePrivacyChange = async (mode: PrivacyMode) => {
    setPrivacy(mode);
    if (!contractLive || !isRegistered || !evidenceContract) return;
    setPrivacyUpdating(true);
    try {
      const tx = await (evidenceContract as any).setPrivacyMode(PRIVACY_CODE[mode]);
      await tx.wait();
      setFeedback({ type: "success", message: `Privacy updated to ${mode}. Applies to future uploads only.\n隐私模式已更新为 ${mode}。仅适用于未来上传。` });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.reason || err.message || "Privacy update failed" });
    } finally {
      setPrivacyUpdating(false);
    }
  };

  // ── Submit Evidence ──
  const handleSubmit = async () => {
    if (!address) return;
    if (privacy === "PRIVATE") {
      setFeedback({ type: "error", message: "Cannot submit evidence in PRIVATE mode. Change privacy setting first.\n私密模式下无法提交证据。请先更改隐私设置。" });
      return;
    }
    if (privacy === "NEGOTIABLE" && !shareConsent) {
      setFeedback({ type: "error", message: "Please consent to share this upload, or change privacy mode.\n请同意共享此次上传，或更改隐私模式。" });
      return;
    }

    setLoading(true);
    setFeedback(null);
    setTxHash("");

    try {
      // Hash the metadata note as content hash (in production, hash the actual file)
      const contentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`${address}-${Date.now()}-${metadataNote}`));

      if (contractLive && evidenceContract) {
        const tx = await (evidenceContract as any).submitEvidence(
          contentHash,
          DATA_CLASS_CODE[dataClass],
          metadataNote || "eyechain-evidence",
          shareConsent,
        );
        setTxHash(tx.hash);
        await tx.wait();
        setFeedback({ type: "success", message: "Evidence submitted on-chain! Awaiting appraisal.\n证据已提交上链！等待评估。" });
      } else {
        // Simulation
        await new Promise(r => setTimeout(r, 1200));
        setFeedback({ type: "success", message: "[Simulation] Evidence recorded locally. Deploy EvidenceRewards for on-chain submission.\n[模拟] 证据已本地记录。部署 EvidenceRewards 合约以进行链上提交。" });
      }

      const newEvidence: LocalEvidence = {
        id: evidenceList.length + 1,
        dataClass,
        contentHash: contentHash.slice(0, 18) + "...",
        status: "PENDING",
        rewardUsd: 0,
        submittedAt: Date.now(),
      };
      setEvidenceList(prev => [newEvidence, ...prev]);
      setMetadataNote("");
    } catch (err: any) {
      setFeedback({ type: "error", message: err.reason || err.message || "Submission failed 提交失败" });
    } finally {
      setLoading(false);
    }
  };

  // ── Claim ──
  const handleClaim = async () => {
    if (claimable <= 0) return;
    setClaiming(true);
    try {
      if (contractLive && evidenceContract) {
        const tx = await (evidenceContract as any).claim();
        await tx.wait();
      } else {
        await new Promise(r => setTimeout(r, 1000));
      }
      setTotalClaimed(prev => prev + claimable);
      const amt = claimable;
      setClaimable(0);
      setFeedback({ type: "success", message: `Claimed ${amt.toFixed(6)} AVAX!\n已领取 ${amt.toFixed(6)} AVAX！` });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.reason || err.message || "Claim failed 领取失败" });
    } finally {
      setClaiming(false);
    }
  };

  const selectClass = "w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-foreground font-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary";
  const labelClass = "block font-mono text-xs text-muted-foreground tracking-wider uppercase mb-1.5";

  return (
    <DashboardPanel title="Evidence Appraisal & Rewards" titleCn="证据评估与奖励" tag="13 · Evidence 证据" tagColor="green">
      {!contractLive && (
        <div className="mb-4 p-3 bg-amber/10 border border-amber/30 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber mt-0.5 shrink-0" />
          <p className="font-mono text-xs text-amber">
            EvidenceRewards contract not deployed — simulation mode active
            <br />EvidenceRewards 合约未部署 — 模拟模式已启用
          </p>
        </div>
      )}

      {/* ── Registration ── */}
      {!isRegistered ? (
        <motion.div initial="hidden" animate="visible" custom={0} variants={stagger} className="space-y-4">
          <div className="bg-muted rounded-lg p-4 border border-border">
            <p className="font-mono text-xs text-muted-foreground tracking-wider uppercase mb-2">PARTICIPATION BOND 参与保证金</p>
            <p className="text-sm text-foreground mb-1">
              A refundable deposit of <span className="text-primary font-bold">~10 USD equivalent</span> (0.005 AVAX on testnet) is required.
            </p>
            <p className="text-sm text-muted-foreground">
              缴纳约 <span className="text-primary font-bold">10 美元等值</span> 的可退还保证金（测试网 0.005 AVAX）。
            </p>
          </div>

          <div>
            <label className={labelClass}>Privacy Mode 隐私模式</label>
            <div className="grid grid-cols-3 gap-2">
              {PRIVACY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPrivacy(opt.value)}
                  className={`p-3 rounded-lg border font-mono text-xs text-center transition-all ${
                    privacy === opt.value
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-muted text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <div className="flex justify-center mb-1">{opt.icon}</div>
                  <span className="block">{opt.label}</span>
                  <span className="block text-[10px] text-muted-foreground">{opt.labelCn}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="font-mono text-[10px] text-muted-foreground tracking-wider mb-1">ELIGIBLE SCOPES 适用范围</p>
            <div className="flex flex-wrap gap-1.5">
              {SCOPE_LABELS.map(s => (
                <span key={s} className="px-2 py-0.5 rounded bg-card border border-border font-mono text-[10px] text-muted-foreground">{s}</span>
              ))}
            </div>
            <p className="font-mono text-[10px] text-destructive mt-2">✗ Cosmetic procedures excluded 不包含美容手术</p>
          </div>

          <button
            onClick={handleRegister}
            disabled={registering || !address}
            className="w-full py-3 rounded-lg font-mono text-sm tracking-wider uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
          >
            {registering ? "Registering... 注册中..." : "Register & Deposit Bond 注册并缴纳保证金"}
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* ── Privacy Settings ── */}
          <motion.div initial="hidden" animate="visible" custom={0} variants={stagger}>
            <label className={labelClass}>Privacy Settings 隐私设置 {privacyUpdating && <span className="text-primary">(saving...)</span>}</label>
            <div className="grid grid-cols-3 gap-2">
              {PRIVACY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handlePrivacyChange(opt.value)}
                  disabled={privacyUpdating}
                  className={`p-2.5 rounded-lg border font-mono text-xs text-center transition-all ${
                    privacy === opt.value
                      ? "border-neon-green bg-neon-green/15 text-neon-green"
                      : "border-border bg-muted text-muted-foreground hover:border-neon-green/40"
                  }`}
                >
                  <div className="flex justify-center mb-0.5">{opt.icon}</div>
                  <span className="block text-[11px]">{opt.label} {opt.labelCn}</span>
                </button>
              ))}
            </div>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">Changes apply to future uploads only / 更改仅适用于未来上传</p>
          </motion.div>

          {/* ── Rewards Overview ── */}
          <motion.div initial="hidden" animate="visible" custom={1} variants={stagger} className="grid grid-cols-3 gap-3">
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-1">
                <Coins className="w-3 h-3 text-neon-green" />
                <p className="font-mono text-[10px] text-muted-foreground">CLAIMABLE 待领取</p>
              </div>
              <p className="font-heading text-xl font-bold text-neon-green mt-1">{claimable.toFixed(4)}</p>
              <p className="font-mono text-[10px] text-muted-foreground">AVAX</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="font-mono text-[10px] text-muted-foreground">CLAIMED 已领取</p>
              <p className="font-heading text-xl font-bold text-amber mt-1">{totalClaimed.toFixed(4)}</p>
              <p className="font-mono text-[10px] text-muted-foreground">AVAX</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="font-mono text-[10px] text-muted-foreground">SUBMISSIONS 提交</p>
              <p className="font-heading text-xl font-bold text-foreground mt-1">{evidenceList.length}</p>
            </div>
          </motion.div>

          {claimable > 0 && (
            <button onClick={handleClaim} disabled={claiming} className="w-full py-2.5 rounded-lg font-mono text-sm tracking-wider uppercase border border-neon-green/50 bg-neon-green/10 text-neon-green hover:bg-neon-green/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <Coins className="w-4 h-4" />
              {claiming ? "Claiming... 领取中..." : `Claim ${claimable.toFixed(4)} AVAX 领取`}
            </button>
          )}

          {/* ── Submit Evidence ── */}
          <motion.div initial="hidden" animate="visible" custom={2} variants={stagger} className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
            <p className="font-mono text-xs text-muted-foreground tracking-wider uppercase flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" /> SUBMIT EVIDENCE 提交证据
            </p>

            {privacy === "PRIVATE" && (
              <div className="p-2.5 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="font-mono text-xs text-destructive">
                  Cannot submit in PRIVATE mode. Change privacy above.
                  <br />私密模式下无法提交。请在上方更改隐私设置。
                </p>
              </div>
            )}

            <div>
              <label className={labelClass}>Data Category 数据分类</label>
              <select value={dataClass} onChange={e => setDataClass(e.target.value as DataClass)} className={selectClass}>
                {DATA_CLASS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} {opt.labelCn} ({opt.rewardRange})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Metadata Note (optional) 备注</label>
              <input
                type="text"
                value={metadataNote}
                onChange={e => setMetadataNote(e.target.value)}
                placeholder="e.g. OCT scan March 2026 / 例如 OCT扫描 2026年3月"
                className={selectClass}
              />
            </div>

            {privacy === "NEGOTIABLE" && (
              <label className="flex items-center gap-3 cursor-pointer text-foreground">
                <input
                  type="checkbox"
                  checked={shareConsent}
                  onChange={e => setShareConsent(e.target.checked)}
                  className="w-4 h-4 accent-cyan rounded"
                />
                <div>
                  <span className="text-sm">Share this upload 分享此次上传</span>
                  <span className="block text-xs text-muted-foreground">Required for Negotiable mode / 每次询问模式下必须同意</span>
                </div>
              </label>
            )}

            <div className="bg-card rounded-lg p-3 border border-border">
              <p className="font-mono text-[10px] text-muted-foreground tracking-wider mb-1">SECURITY NOTE 安全说明</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                Only content hash & metadata stored on-chain. Raw files never leave your device.
                <br />仅内容哈希和元数据存储在链上。原始文件永远不会离开您的设备。
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !address || privacy === "PRIVATE"}
              className="w-full py-3 rounded-lg font-mono text-sm tracking-wider uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              {loading ? "Submitting... 提交中..." : "Submit Evidence Receipt 提交证据收据"}
            </button>
          </motion.div>

          {/* ── Evidence List ── */}
          {evidenceList.length > 0 && (
            <motion.div initial="hidden" animate="visible" custom={3} variants={stagger}>
              <p className="font-mono text-xs text-muted-foreground mb-2">EVIDENCE LOG 证据日志</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {evidenceList.map((e, i) => (
                  <div key={i} className="bg-muted/50 rounded px-3 py-2.5 text-xs font-mono">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground">{new Date(e.submittedAt).toLocaleString()}</span>
                      <span className={`flex items-center gap-1 ${
                        e.status === "APPROVED" ? "text-neon-green" : e.status === "REJECTED" ? "text-destructive" : "text-amber"
                      }`}>
                        {e.status === "PENDING" && <Clock className="w-3 h-3" />}
                        {e.status === "APPROVED" && <CheckCircle className="w-3 h-3" />}
                        {e.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-primary"><FileText className="w-3 h-3 inline mr-0.5" />{DATA_CLASS_OPTIONS.find(d => d.value === e.dataClass)?.label}</span>
                      <span className="text-muted-foreground ml-auto">{e.contentHash}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Reward Ranges ── */}
          <motion.div initial="hidden" animate="visible" custom={4} variants={stagger} className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase mb-2">REWARD SCHEDULE 奖励标准</p>
            <div className="space-y-1">
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-muted-foreground">Primary Data (Exam/Surgery) 初级数据</span>
                <span className="text-neon-green">0.5 – 2.0 USD</span>
              </div>
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-muted-foreground">Subjective/Monthly 主观/月度</span>
                <span className="text-amber">0.1 – 1.0 USD</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {feedback && (
        <div className={`mt-3 p-3 rounded-lg border flex items-start gap-2 ${feedback.type === "success" ? "bg-neon-green/10 border-neon-green/30" : "bg-destructive/10 border-destructive/30"}`}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4 text-neon-green mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />}
          <p className={`font-mono text-xs whitespace-pre-line ${feedback.type === "success" ? "text-neon-green" : "text-destructive"}`}>{feedback.message}</p>
        </div>
      )}

      {txHash && (
        <div className="mt-3 p-3 bg-muted rounded-lg">
          <p className="font-mono text-xs text-muted-foreground">TX Hash 交易哈希:</p>
          <a href={`${FUJI_EXPLORER}/tx/${txHash}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-primary break-all hover:underline">{txHash}</a>
        </div>
      )}
    </DashboardPanel>
  );
}
