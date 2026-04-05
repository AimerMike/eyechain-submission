import { useState, useRef } from "react";
import { ethers } from "ethers";
import DashboardPanel from "./DashboardPanel";
import type { RiskSubmission } from "./SubmitRiskEvent";
import { hasContractMethod } from "@/lib/contract";
import { motion } from "framer-motion";
import { Info, CheckCircle, AlertTriangle, Building2, User, TrendingUp, ArrowDown, Coins, ShieldCheck, Zap } from "lucide-react";

interface Props {
  address: string | null;
  lastSubmission?: RiskSubmission | null;
  dataRewardsContract?: ethers.Contract | null;
}

interface ShareRecord {
  hash: string;
  baseReward: number;
  riskPremium: number;
  totalReward: number;
  timestamp: number;
  targets: string[];
  riskScore: number;
}

type ViewMode = "user" | "institution";

function hashSubmission(s: RiskSubmission | null): string {
  if (!s) return "";
  return `${s.accel}-${s.posture}-${s.duration}-${s.symptoms}-${s.riskScore}`;
}

const stagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.3, duration: 0.5, ease: "easeOut" },
  }),
};

export default function DataSharing({ address, lastSubmission, dataRewardsContract }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("user");
  const [shareMedical, setShareMedical] = useState(false);
  const [shareResearch, setShareResearch] = useState(false);
  const [shareNetwork, setShareNetwork] = useState(false);
  const [rewardBalance, setRewardBalance] = useState(0);
  const [claimableRewards, setClaimableRewards] = useState(0);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [history, setHistory] = useState<ShareRecord[]>([]);
  const sharedHashesRef = useRef<Set<string>>(new Set());

  // Institution state
  const [institutionDeposit] = useState(12.5);
  const [dataAccessCount] = useState(847);
  const [daoTreasury] = useState(3.75);
  const [userPool] = useState(8.75);
  const [purchaseCount, setPurchaseCount] = useState(10);

  const rewardsContractLive = hasContractMethod(dataRewardsContract, "claimReward");

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

  const computeRewardBreakdown = (riskScore: number, targets: string[]) => {
    const baseReward = targets.length * 0.001; // Base Compensation per target
    const riskPremium = (riskScore / 100) * 0.005; // Risk Premium proportional to RPN
    return { baseReward, riskPremium, totalReward: baseReward + riskPremium };
  };

  const handleShare = async () => {
    if (!address) return alert("Connect wallet first / 请先连接钱包");
    if (!anySelected) return;
    setFeedback(null);
    setLoading(true);
    try {
      if (!isValidSubmission(lastSubmission)) {
        setFeedback({ type: "error", message: "Validation Failed: Please submit a risk event with valid data first.\n验证失败：请先提交有效的风险事件数据。" });
        return;
      }
      const currentHash = hashSubmission(lastSubmission!);
      const targetKey = `${currentHash}:${selectedTargets.sort().join(",")}`;
      if (sharedHashesRef.current.has(targetKey)) {
        setFeedback({ type: "error", message: "Duplicate data detected. Rewards are only granted for unique, new eye-health entries.\n检测到重复数据。仅对唯一的新眼健康数据条目发放奖励。" });
        return;
      }
      await new Promise(r => setTimeout(r, 1500));

      const { baseReward, riskPremium, totalReward } = computeRewardBreakdown(lastSubmission!.riskScore, selectedTargets);
      sharedHashesRef.current.add(targetKey);
      setClaimableRewards(prev => prev + totalReward);
      setHistory(prev => [
        { hash: targetKey.slice(0, 16), baseReward, riskPremium, totalReward, timestamp: Date.now(), targets: selectedTargets, riskScore: lastSubmission!.riskScore },
        ...prev,
      ]);
      setFeedback({
        type: "success",
        message: `Data encrypted and sold to Research Node. Reward verified by eye-chain protocol.\n数据已加密并出售给研究节点。奖励已由 eye-chain 协议验证。\n\nBase Compensation 基础报酬: +${baseReward.toFixed(4)} ETK\nRisk Premium (RPN:${lastSubmission!.riskScore}) 风险溢价: +${riskPremium.toFixed(4)} ETK\nTotal 合计: +${totalReward.toFixed(4)} EyeToken (Claimable 待领取)`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Monetization failed / 变现失败" });
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (claimableRewards <= 0) return;
    setClaiming(true);
    try {
      if (rewardsContractLive && dataRewardsContract) {
        const tx = await (dataRewardsContract as any).claimReward();
        await tx.wait();
      } else {
        await new Promise(r => setTimeout(r, 1200));
      }
      setRewardBalance(prev => prev + claimableRewards);
      const claimed = claimableRewards;
      setClaimableRewards(0);
      setFeedback({ type: "success", message: `Claimed ${claimed.toFixed(4)} EyeToken successfully!\n成功领取 ${claimed.toFixed(4)} EyeToken！` });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.reason || err.message || "Claim failed" });
    } finally {
      setClaiming(false);
    }
  };

  const checkClass = "w-4 h-4 accent-cyan rounded";

  return (
    <DashboardPanel title="Data Monetization Portal" titleCn="数据变现门户" tag="04 · Monetize 变现" tagColor="amber">
      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setViewMode("user")} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs tracking-wider uppercase border transition-all ${viewMode === "user" ? "border-amber bg-amber/20 text-amber" : "border-border bg-muted text-muted-foreground hover:border-amber/50"}`}>
          <User className="w-3.5 h-3.5" /> Data Provider 数据提供者
        </button>
        <button onClick={() => setViewMode("institution")} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs tracking-wider uppercase border transition-all ${viewMode === "institution" ? "border-primary bg-primary/20 text-primary" : "border-border bg-muted text-muted-foreground hover:border-primary/50"}`}>
          <Building2 className="w-3.5 h-3.5" /> Institution 机构
        </button>
      </div>

      {viewMode === "institution" ? (
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

          {/* Market Liquidity Indicator */}
          <div className="bg-muted rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary animate-pulse" />
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">MARKET LIQUIDITY 市场流动性</p>
            </div>
            <div className="h-2 rounded-full bg-card overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-neon-green rounded-full transition-all" style={{ width: "72%" }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="font-mono text-[10px] text-muted-foreground">72% Funded 已注资</span>
              <span className="font-mono text-[10px] text-neon-green">Healthy 健康</span>
            </div>
          </div>

          {/* Revenue Distribution */}
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

          {/* Purchase Data Access */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-3">
            <p className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">PURCHASE DATA ACCESS 购买数据访问权限</p>
            <div className="flex items-center gap-3">
              <label className="font-mono text-xs text-muted-foreground">Records 条数:</label>
              <input type="number" min={1} max={1000} value={purchaseCount} onChange={e => setPurchaseCount(Number(e.target.value))} className="w-24 bg-card border border-border rounded px-3 py-1.5 text-foreground font-mono text-sm focus:outline-none focus:border-primary" />
              <span className="font-mono text-xs text-muted-foreground">× 0.01 ETK = {(purchaseCount * 0.01).toFixed(2)} ETK</span>
            </div>
            <button disabled className="w-full py-3 rounded-lg font-mono text-sm tracking-wider uppercase border border-primary/50 bg-primary/10 text-primary opacity-60 cursor-not-allowed">
              Purchase Data Credits (Demo) 购买数据积分（演示）
            </button>
          </div>

          {/* Reward Loop Diagram */}
          <div className="bg-muted rounded-lg p-4 border border-border">
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase mb-3">REWARD LOOP 奖励循环</p>
            <div className="flex flex-col items-center gap-1">
              {[
                { text: "User Session 用户会话", color: "bg-card border-border text-foreground" },
                { text: "RPN Calculation RPN计算", color: "bg-primary/10 border-primary/30 text-primary" },
                { text: "Institution Purchase 机构购买", color: "bg-amber/10 border-amber/30 text-amber" },
                { text: "Token Payout 代币支付", color: "bg-neon-green/10 border-neon-green/30 text-neon-green" },
              ].map((node, i) => (
                <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="w-full">
                  <div className={`px-4 py-2.5 rounded-lg border font-mono text-xs text-center ${node.color}`}>
                    {node.text}
                  </div>
                  {i < 3 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-sm font-mono mb-4">
            Monetize your eye-health data. Institutions pay tokens — 70% flows to you as Data Monetization Dividends.
            <br />将您的眼健康数据变现。机构支付代币 — 70% 作为数据变现分红流向您。
          </p>

          {/* Market Liquidity Status */}
          <div className="mb-4 flex items-center gap-2 p-2.5 bg-muted rounded-lg border border-border">
            <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span className="font-mono text-[10px] text-muted-foreground tracking-wider">INSTITUTIONAL FUNDING 机构注资:</span>
            <div className="flex-1 h-1.5 rounded-full bg-card overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-neon-green rounded-full" style={{ width: "72%" }} />
            </div>
            <span className="font-mono text-[10px] text-neon-green">72%</span>
          </div>

          <div className="space-y-3 mb-5">
            {[
              { checked: shareMedical, set: setShareMedical, label: "Medical Institutions 医疗机构", desc: "Hospitals & clinics pay for clinical analysis data / 医院和诊所付费获取临床分析数据" },
              { checked: shareResearch, set: setShareResearch, label: "Research Organizations 研究机构", desc: "Academic institutions purchase anonymized datasets / 学术机构购买匿名数据集" },
              { checked: shareNetwork, set: setShareNetwork, label: "EyeChain Network Peers 链上成员共享", desc: "DAO peer-to-peer data marketplace / DAO 点对点数据市场" },
            ].map(item => (
              <label key={item.label} className="flex items-center gap-3 cursor-pointer text-foreground">
                <input type="checkbox" checked={item.checked} onChange={e => item.set(e.target.checked)} className={checkClass} />
                <div>
                  <span className="text-sm">{item.label}</span>
                  <span className="block text-xs text-muted-foreground">{item.desc}</span>
                </div>
              </label>
            ))}
          </div>

          {/* Balances with Reward Breakdown */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-muted rounded-lg p-3">
              <p className="font-mono text-[10px] text-muted-foreground">CLAIMED 已领取</p>
              <p className="font-heading text-xl font-bold text-amber mt-1">{rewardBalance.toFixed(4)}</p>
              <p className="font-mono text-[10px] text-muted-foreground">EyeToken</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex items-center gap-1">
                <Coins className="w-3 h-3 text-neon-green" />
                <p className="font-mono text-[10px] text-muted-foreground">CLAIMABLE 待领取</p>
              </div>
              <p className="font-heading text-xl font-bold text-neon-green mt-1">{claimableRewards.toFixed(4)}</p>
              <p className="font-mono text-[10px] text-muted-foreground">EyeToken</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="font-mono text-[10px] text-muted-foreground">SALES 销售</p>
              <p className="font-heading text-xl font-bold text-foreground mt-1">{history.length}</p>
            </div>
          </div>

          {/* Claim Button */}
          {claimableRewards > 0 && (
            <button onClick={handleClaim} disabled={claiming} className="w-full py-2.5 mb-3 rounded-lg font-mono text-sm tracking-wider uppercase border border-neon-green/50 bg-neon-green/10 text-neon-green hover:bg-neon-green/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              {claiming ? "Claiming... 领取中..." : `Claim ${claimableRewards.toFixed(4)} EyeToken 领取代币`}
            </button>
          )}

          {!isValidSubmission(lastSubmission) && (
            <div className="mb-4 p-3 bg-amber/10 border border-amber/30 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-amber mt-0.5 shrink-0" />
              <p className="font-mono text-xs text-amber">
                Submit a risk event (Step 02) first to generate monetizable data.
                <br />请先提交风险事件（第02步）以生成可变现的数据。
              </p>
            </div>
          )}

          <button onClick={handleShare} disabled={loading || !address || !anySelected || !isValidSubmission(lastSubmission)} className="w-full py-3 rounded-lg font-mono text-sm tracking-wider uppercase border border-amber/50 bg-amber/10 text-amber hover:bg-amber/20 transition-all disabled:opacity-50">
            {loading ? "Verifying & Monetizing... 验证并变现中..." : "Sell Data & Earn Dividends 出售数据赚取分红"}
          </button>

          {feedback && (
            <div className={`mt-3 p-3 rounded-lg border flex items-start gap-2 ${feedback.type === "success" ? "bg-neon-green/10 border-neon-green/30" : "bg-destructive/10 border-destructive/30"}`}>
              {feedback.type === "success" ? <CheckCircle className="w-4 h-4 text-neon-green mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />}
              <p className={`font-mono text-xs whitespace-pre-line ${feedback.type === "success" ? "text-neon-green" : "text-destructive"}`}>{feedback.message}</p>
            </div>
          )}

          {/* Reward History with Breakdown */}
          {history.length > 0 && (
            <div className="mt-4">
              <p className="font-mono text-xs text-muted-foreground mb-2">RECENT SALES 最近销售记录</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {history.map((r, i) => (
                  <div key={i} className="bg-muted/50 rounded px-3 py-2.5 text-xs font-mono">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-muted-foreground">{new Date(r.timestamp).toLocaleString()}</span>
                      <span className="text-neon-green font-bold">+{r.totalReward.toFixed(4)} ETK</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-primary">RPN:{r.riskScore}</span>
                      <span className="text-muted-foreground">Base: {r.baseReward.toFixed(4)}</span>
                      <span className="text-amber">Premium: {r.riskPremium.toFixed(4)}</span>
                      <span className="text-muted-foreground ml-auto">{r.targets.join(", ")}</span>
                    </div>
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
