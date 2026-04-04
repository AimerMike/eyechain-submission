import { useState, useRef } from "react";
import DashboardPanel from "./DashboardPanel";
import type { RiskSubmission } from "./SubmitRiskEvent";
import { Info, CheckCircle, AlertTriangle, Building2, User, TrendingUp } from "lucide-react";

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

type ViewMode = "user" | "institution";

function hashSubmission(s: RiskSubmission | null): string {
  if (!s) return "";
  return `${s.accel}-${s.posture}-${s.duration}-${s.symptoms}-${s.riskScore}`;
}

export default function DataSharing({ address, lastSubmission }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("user");
  const [shareMedical, setShareMedical] = useState(false);
  const [shareResearch, setShareResearch] = useState(false);
  const [shareNetwork, setShareNetwork] = useState(false);
  const [rewardBalance, setRewardBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [history, setHistory] = useState<ShareRecord[]>([]);
  const sharedHashesRef = useRef<Set<string>>(new Set());

  // Institution mock state
  const [institutionDeposit] = useState(12.5);
  const [dataAccessCount] = useState(847);
  const [daoTreasury] = useState(3.75);
  const [userPool] = useState(8.75);

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
        message: `Data encrypted and sold to Research Node. Reward verified by eye-chain protocol.\n数据已加密并出售给研究节点。奖励已由 eye-chain 协议验证。\n+${reward.toFixed(4)} EyeToken`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Monetization failed / 变现失败",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkClass = "w-4 h-4 accent-cyan rounded";

  return (
    <DashboardPanel title="Data Monetization Portal" titleCn="数据变现门户" tag="04 · Monetize 变现" tagColor="amber">
      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setViewMode("user")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs tracking-wider uppercase border transition-all ${
            viewMode === "user"
              ? "border-amber bg-amber/20 text-amber"
              : "border-border bg-muted text-muted-foreground hover:border-amber/50"
          }`}
        >
          <User className="w-3.5 h-3.5" /> Data Provider 数据提供者
        </button>
        <button
          onClick={() => setViewMode("institution")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs tracking-wider uppercase border transition-all ${
            viewMode === "institution"
              ? "border-primary bg-primary/20 text-primary"
              : "border-border bg-muted text-muted-foreground hover:border-primary/50"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" /> Institution 机构
        </button>
      </div>

      {viewMode === "institution" ? (
        /* Institution / Researcher Dashboard */
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm font-mono">
            Institutions deposit tokens to access aggregated, anonymized eye-health datasets.
            <br />机构存入代币以访问汇总的匿名眼健康数据集。
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-4">
              <p className="font-mono text-[10px] text-muted-foreground tracking-wider">DEPOSIT BALANCE 存款余额</p>
              <p className="font-heading text-2xl font-bold text-primary mt-1">{institutionDeposit.toFixed(2)} <span className="text-sm text-muted-foreground">ETK</span></p>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <p className="font-mono text-[10px] text-muted-foreground tracking-wider">DATA ACCESSED 已访问数据</p>
              <p className="font-heading text-2xl font-bold text-foreground mt-1">{dataAccessCount} <span className="text-sm text-muted-foreground">records</span></p>
            </div>
          </div>

          {/* Revenue Distribution Chart */}
          <div className="bg-muted rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-amber" />
              <p className="font-mono text-xs text-muted-foreground tracking-wider uppercase">REVENUE DISTRIBUTION 收益分配</p>
            </div>
            <div className="flex h-6 rounded-full overflow-hidden mb-3">
              <div className="bg-neon-green h-full flex items-center justify-center" style={{ width: "70%" }}>
                <span className="font-mono text-[10px] text-background font-bold">70%</span>
              </div>
              <div className="bg-amber h-full flex items-center justify-center" style={{ width: "30%" }}>
                <span className="font-mono text-[10px] text-background font-bold">30%</span>
              </div>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neon-green">User Reward Pool 用户奖励池: {userPool.toFixed(2)} ETK</span>
              <span className="text-amber">DAO Treasury 国库: {daoTreasury.toFixed(2)} ETK</span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="font-mono text-[10px] text-muted-foreground">
              Cost: 0.01 ETK per record · Minimum deposit: 1.0 ETK
              <br />费用：每条记录 0.01 ETK · 最低存款：1.0 ETK
            </p>
          </div>

          <button disabled className="w-full py-3 rounded-lg font-mono text-sm tracking-wider uppercase border border-primary/50 bg-primary/10 text-primary opacity-60 cursor-not-allowed">
            Purchase Data Access (Demo) 购买数据访问权限（演示）
          </button>
        </div>
      ) : (
        /* User / Data Provider View */
        <>
          <p className="text-muted-foreground text-sm font-mono mb-4">
            Monetize your eye-health data. Institutions pay tokens — 70% flows to you as Data Monetization Dividends.
            <br />将您的眼健康数据变现。机构支付代币 — 70% 作为数据变现分红流向您。
          </p>

          <div className="space-y-3 mb-5">
            <label className="flex items-center gap-3 cursor-pointer text-foreground">
              <input type="checkbox" checked={shareMedical} onChange={e => setShareMedical(e.target.checked)} className={checkClass} />
              <div>
                <span className="text-sm">Medical Institutions 医疗机构</span>
                <span className="block text-xs text-muted-foreground">Hospitals & clinics pay for clinical analysis data / 医院和诊所付费获取临床分析数据</span>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer text-foreground">
              <input type="checkbox" checked={shareResearch} onChange={e => setShareResearch(e.target.checked)} className={checkClass} />
              <div>
                <span className="text-sm">Research Organizations 研究机构</span>
                <span className="block text-xs text-muted-foreground">Academic institutions purchase anonymized datasets / 学术机构购买匿名数据集</span>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer text-foreground">
              <input type="checkbox" checked={shareNetwork} onChange={e => setShareNetwork(e.target.checked)} className={checkClass} />
              <div>
                <span className="text-sm">EyeChain Network Peers 链上成员共享</span>
                <span className="block text-xs text-muted-foreground">DAO peer-to-peer data marketplace / DAO 点对点数据市场</span>
              </div>
            </label>
          </div>

          <div className="bg-muted rounded-lg p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-xs text-muted-foreground">DIVIDEND BALANCE 分红余额</p>
              <p className="font-heading text-2xl font-bold text-amber mt-1">
                {rewardBalance.toFixed(4)} <span className="text-sm text-muted-foreground">EyeToken</span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-muted-foreground">SALES 销售次数</p>
              <p className="font-heading text-lg text-foreground mt-1">{history.length}</p>
            </div>
          </div>

          {!isValidSubmission(lastSubmission) && (
            <div className="mb-4 p-3 bg-amber/10 border border-amber/30 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-amber mt-0.5 shrink-0" />
              <p className="font-mono text-xs text-amber">
                Submit a risk event (Step 02) first to generate monetizable data.
                <br />请先提交风险事件（第02步）以生成可变现的数据。
              </p>
            </div>
          )}

          <button
            onClick={handleShare}
            disabled={loading || !address || !anySelected || !isValidSubmission(lastSubmission)}
            className="w-full py-3 rounded-lg font-mono text-sm tracking-wider uppercase border border-amber/50 bg-amber/10 text-amber hover:bg-amber/20 transition-all disabled:opacity-50"
          >
            {loading ? "Verifying & Monetizing... 验证并变现中..." : "Sell Data & Earn Dividends 出售数据赚取分红"}
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
              <p className="font-mono text-xs text-muted-foreground mb-2">RECENT SALES 最近销售记录</p>
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
        </>
      )}
    </DashboardPanel>
  );
}
