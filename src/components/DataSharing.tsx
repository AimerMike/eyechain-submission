import { useState, useRef } from "react";
import DashboardPanel from "./DashboardPanel";
import type { RiskSubmission } from "./SubmitRiskEvent";
import { Info, CheckCircle, AlertTriangle } from "lucide-react";

interface Props {
  address: string | null;
  lastSubmission?: RiskSubmission | null;
}

interface ShareRecord {
  hash: string;
  reward: number;
  timestamp: number;
  targets: string[];
}

function hashSubmission(s: RiskSubmission | null): string {
  if (!s) return "";
  return `${s.accel}-${s.posture}-${s.duration}-${s.symptoms}-${s.riskScore}`;
}

export default function DataSharing({ address, lastSubmission }: Props) {
  const [shareMedical, setShareMedical] = useState(false);
  const [shareResearch, setShareResearch] = useState(false);
  const [shareNetwork, setShareNetwork] = useState(false);
  const [rewardBalance, setRewardBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [history, setHistory] = useState<ShareRecord[]>([]);
  const sharedHashesRef = useRef<Set<string>>(new Set());

  const selectedTargets = [
    ...(shareMedical ? ["Medical 医疗"] : []),
    ...(shareResearch ? ["Research 研究"] : []),
    ...(shareNetwork ? ["Network 网络"] : []),
  ];
  const anySelected = selectedTargets.length > 0;

  const isValidSubmission = (s: RiskSubmission | null): boolean => {
    if (!s) return false;
    return s.accel > 0 && s.posture > 0 && s.duration > 0;
  };

  const handleShare = async () => {
    if (!address) return alert("Connect wallet first / 请先连接钱包");
    if (!anySelected) return;

    setFeedback(null);
    setLoading(true);

    try {
      if (!isValidSubmission(lastSubmission)) {
        setFeedback({
          type: "error",
          message: "Validation Failed: Please submit a risk event with valid data first (non-zero Acceleration, Posture, Duration).\n验证失败：请先提交有效的风险事件数据（加速度、姿态、时长不能为零）。",
        });
        return;
      }

      const currentHash = hashSubmission(lastSubmission!);
      const targetKey = `${currentHash}:${selectedTargets.sort().join(",")}`;

      if (sharedHashesRef.current.has(targetKey)) {
        setFeedback({
          type: "error",
          message: "Duplicate data detected. Rewards are only granted for unique, new eye-health entries.\n检测到重复数据。仅对唯一的新眼健康数据条目发放奖励。",
        });
        return;
      }

      await new Promise(r => setTimeout(r, 1500));

      const reward = selectedTargets.length * 0.001;
      sharedHashesRef.current.add(targetKey);

      setRewardBalance(prev => prev + reward);
      setHistory(prev => [
        { hash: targetKey.slice(0, 16), reward, timestamp: Date.now(), targets: selectedTargets },
        ...prev,
      ]);
      setFeedback({
        type: "success",
        message: `Verification Success: +${reward.toFixed(4)} EyeToken\n验证成功：+${reward.toFixed(4)} EyeToken`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Sharing failed / 共享失败",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkClass = "w-4 h-4 accent-cyan rounded";

  return (
    <DashboardPanel title="Data Sharing & Rewards" titleCn="数据共享与奖励" tag="04 · Share 共享" tagColor="amber">
      <p className="text-muted-foreground text-sm font-mono mb-4">
        Share your eye-health data to earn EyeToken rewards. Only unique submissions are rewarded.
        <br />分享您的眼健康数据以获得 EyeToken 奖励。仅对唯一提交数据发放奖励。
      </p>

      <div className="space-y-3 mb-5">
        <label className="flex items-center gap-3 cursor-pointer text-foreground">
          <input type="checkbox" checked={shareMedical} onChange={e => setShareMedical(e.target.checked)} className={checkClass} />
          <div>
            <span className="text-sm">Medical Institutions 医疗机构</span>
            <span className="block text-xs text-muted-foreground">Share with hospitals and clinics for clinical analysis / 与医院和诊所共享用于临床分析</span>
          </div>
        </label>
        <label className="flex items-center gap-3 cursor-pointer text-foreground">
          <input type="checkbox" checked={shareResearch} onChange={e => setShareResearch(e.target.checked)} className={checkClass} />
          <div>
            <span className="text-sm">Research Organizations 研究机构</span>
            <span className="block text-xs text-muted-foreground">Contribute to academic and medical research / 为学术和医学研究做出贡献</span>
          </div>
        </label>
        <label className="flex items-center gap-3 cursor-pointer text-foreground">
          <input type="checkbox" checked={shareNetwork} onChange={e => setShareNetwork(e.target.checked)} className={checkClass} />
          <div>
            <span className="text-sm">EyeChain Network Peers 链上成员共享</span>
            <span className="block text-xs text-muted-foreground">DAO peer-to-peer data sharing for collective intelligence / DAO 点对点数据共享，实现集体智慧</span>
          </div>
        </label>
      </div>

      <div className="bg-muted rounded-lg p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">REWARD BALANCE 奖励余额</p>
          <p className="font-heading text-2xl font-bold text-amber mt-1">
            {rewardBalance.toFixed(4)} <span className="text-sm text-muted-foreground">EyeToken</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs text-muted-foreground">SHARES 共享次数</p>
          <p className="font-heading text-lg text-foreground mt-1">{history.length}</p>
        </div>
      </div>

      {!isValidSubmission(lastSubmission) && (
        <div className="mb-4 p-3 bg-amber/10 border border-amber/30 rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 text-amber mt-0.5 shrink-0" />
          <p className="font-mono text-xs text-amber">
            Submit a risk event (Step 02) first to generate shareable data.
            <br />请先提交风险事件（第02步）以生成可共享的数据。
          </p>
        </div>
      )}

      <button
        onClick={handleShare}
        disabled={loading || !address || !anySelected || !isValidSubmission(lastSubmission)}
        className="w-full py-3 rounded-lg font-mono text-sm tracking-wider uppercase border border-amber/50 bg-amber/10 text-amber hover:bg-amber/20 transition-all disabled:opacity-50"
      >
        {loading ? "Verifying & Sharing... 验证并共享中..." : "Share Data & Earn Rewards 共享数据赚取奖励"}
      </button>

      {feedback && (
        <div className={`mt-3 p-3 rounded-lg border flex items-start gap-2 ${feedback.type === "success" ? "bg-neon-green/10 border-neon-green/30" : "bg-destructive/10 border-destructive/30"}`}>
          {feedback.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-neon-green mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          )}
          <p className={`font-mono text-xs whitespace-pre-line ${feedback.type === "success" ? "text-neon-green" : "text-destructive"}`}>
            {feedback.message}
          </p>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-xs text-muted-foreground mb-2">RECENT SHARES 最近共享记录</p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {history.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-muted/50 rounded px-3 py-1.5 text-xs font-mono">
                <span className="text-muted-foreground">{new Date(r.timestamp).toLocaleTimeString()}</span>
                <span className="text-foreground">{r.targets.join(", ")}</span>
                <span className="text-neon-green">+{r.reward.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}
