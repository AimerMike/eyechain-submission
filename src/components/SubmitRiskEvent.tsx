import { useState } from "react";
import { ethers } from "ethers";
import DashboardPanel from "./DashboardPanel";
import { FUJI_CHAIN_ID, FUJI_EXPLORER, clampUint8, ensureContractMethod, hasContractMethod, symptomsToFlag } from "@/lib/contract";
import { Info } from "lucide-react";

interface Props {
  contract: ethers.Contract | null;
  address: string | null;
  onRiskSubmitted?: (data: RiskSubmission) => void;
}

export interface RiskSubmission {
  accel: number;
  posture: number;
  duration: number;
  symptoms: number;
  riskScore: number;
  timestamp: number;
}

const ACCEL_OPTIONS = [
  { value: 10, label: "Low 低", labelCn: "< 2G 日常活动" },
  { value: 35, label: "Medium 中", labelCn: "2-5G 运动" },
  { value: 65, label: "High 高", labelCn: "5-8G 剧烈运动" },
  { value: 90, label: "Extreme 极端", labelCn: "> 8G 极限冲击" },
];

const POSTURE_OPTIONS = [
  { value: 10, label: "Neutral 中立", labelCn: "头部正位，无倾斜" },
  { value: 40, label: "Forward Lean 前倾", labelCn: "持续低头姿势" },
  { value: 65, label: "Prolonged Static 长时间静止", labelCn: "固定体位 >2小时" },
  { value: 85, label: "Inverted / Extreme 倒立/极端", labelCn: "头部低于心脏位置" },
];

const DURATION_OPTIONS = [
  { value: 10, label: "< 2 hours 小时", labelCn: "短时间暴露" },
  { value: 35, label: "2–6 hours 小时", labelCn: "中等时长暴露" },
  { value: 65, label: "6–10 hours 小时", labelCn: "长时间暴露" },
  { value: 90, label: "10+ hours 小时", labelCn: "超长时间暴露" },
];

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex ml-1.5 cursor-help">
      <Info className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 rounded-lg bg-card border border-border text-xs text-muted-foreground font-mono opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 shadow-lg">
        {text}
      </span>
    </span>
  );
}

export default function SubmitRiskEvent({ contract, address, onRiskSubmitted }: Props) {
  const [accel, setAccel] = useState(10);
  const [posture, setPosture] = useState(10);
  const [duration, setDuration] = useState(10);
  const [floaters, setFloaters] = useState(false);
  const [flashes, setFlashes] = useState(false);
  const [pain, setPain] = useState(false);
  const [visionLoss, setVisionLoss] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const riskEventSupported = hasContractMethod(contract, "submitRiskEvent");

  // FMEA-based RPN: Risk Priority Number = Severity × Occurrence × Detection
  // Each factor is normalized to 1-10 scale, then multiplied → max RPN = 1000
  // Final score mapped to 0-100 for display
  const computeLocalRisk = () => {
    const normalize = (v: number) => Math.max(1, Math.round((v / 100) * 10));
    const severity = normalize(accel);       // Acceleration → Severity
    const occurrence = normalize(duration);   // Duration → Occurrence (longer = more frequent exposure)
    const detection = normalize(posture);     // Posture → Detection difficulty
    const symptomFlag = symptomsToFlag(floaters, flashes, pain, visionLoss);
    const symptomMultiplier = 1 + (symptomFlag / 15) * 0.5; // up to 1.5x

    const rpn = severity * occurrence * detection * symptomMultiplier;
    // Map RPN (1–1500) to 0–100 score
    return Math.min(100, Math.round((rpn / 1000) * 100));
  };

  const simulateProcessing = async (score: number) => {
    setSimulating(true);
    const stages = [
      "Analyzing acceleration data... 分析加速度数据...",
      "Evaluating posture impact... 评估姿态影响...",
      "Computing duration factor... 计算持续时间因子...",
      "Processing symptom flags... 处理症状标记...",
      "Generating personalized risk assessment... 生成个性化风险评估...",
    ];
    for (const stage of stages) {
      setStatusMessage(stage);
      await new Promise(r => setTimeout(r, 600));
    }
    setSimulating(false);
    setRiskScore(score);
    setStatusMessage("✓ Risk assessment complete / 风险评估完成");
  };

  const handleSubmit = async () => {
    if (!contract || !address) return alert("Connect wallet first / 请先连接钱包");

    setLoading(true);
    setStatusMessage("");
    setRiskScore(null);

    try {
      const network = await contract.provider.getNetwork();
      if (Number(network.chainId) !== FUJI_CHAIN_ID) {
        throw new Error("Please switch MetaMask to Avalanche Fuji (43113) / 请切换 MetaMask 到 Avalanche Fuji (43113)");
      }

      if (hasContractMethod(contract, "registeredUsers")) {
        const isRegistered = await (contract as any).registeredUsers(address);
        if (!isRegistered) {
          throw new Error("Please complete registration first / 请先完成注册");
        }
      }

      const symptoms = symptomsToFlag(floaters, flashes, pain, visionLoss);
      const score = computeLocalRisk();

      if (riskEventSupported) {
        const currentContract = ensureContractMethod(contract, "submitRiskEvent", "Risk Event");
        const tx = await currentContract.submitRiskEvent(
          clampUint8(accel, 0, 100),
          clampUint8(posture, 0, 100),
          clampUint8(duration, 0, 100),
          symptoms,
        );
        setTxHash(tx.hash);
        await tx.wait();
      } else {
        setStatusMessage("Contract does not support submitRiskEvent — running local simulation\n合约不支持 submitRiskEvent — 执行本地模拟");
        await new Promise(r => setTimeout(r, 500));
      }

      await simulateProcessing(score);

      const submission: RiskSubmission = {
        accel, posture, duration, symptoms, riskScore: score, timestamp: Date.now(),
      };
      onRiskSubmitted?.(submission);
    } catch (err: any) {
      console.error(err);
      const message = err.reason || err.data?.message || err.message || "Submission failed / 提交失败";
      setStatusMessage(message);
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-foreground font-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary";
  const labelClass = "flex items-center font-mono text-xs text-muted-foreground tracking-wider uppercase mb-1.5";
  const checkClass = "w-4 h-4 accent-cyan rounded";

  // FMEA thresholds: multiplication makes mid-range scores more meaningful
  const alertLevel = riskScore !== null ? (riskScore >= 70 ? "CRITICAL" : riskScore >= 40 ? "WARNING" : "NORMAL") : null;

  return (
    <DashboardPanel title="Submit Risk Event" titleCn="提交风险事件" tag="02 · Risk Event 风险事件" tagColor="magenta">
      {!riskEventSupported && address && (
        <div className="mb-4 p-3 bg-amber/10 border border-amber/30 rounded-lg">
          <p className="font-mono text-xs text-amber">Contract ABI missing submitRiskEvent — local simulation mode active<br/>合约 ABI 缺少 submitRiskEvent — 已启用本地模拟模式</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>
            Acceleration Load 加速度负荷
            <InfoTooltip text="Based on G-force impact on vitreous body. Higher G-force increases retinal stress. 基于G力对玻璃体的影响。G力越大，视网膜压力越大。" />
          </label>
          <select value={accel} onChange={e => setAccel(Number(e.target.value))} className={selectClass}>
            {ACCEL_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label} — {o.labelCn}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>
            Posture Load 姿态负荷
            <InfoTooltip text="Head position affects intraocular pressure. Inverted postures significantly increase risk. 头部位置影响眼压。倒立姿势显著增加风险。" />
          </label>
          <select value={posture} onChange={e => setPosture(Number(e.target.value))} className={selectClass}>
            {POSTURE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label} — {o.labelCn}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>
            Duration Score 持续时间
            <InfoTooltip text="Continuous exposure duration. Prolonged screen time or physical stress worsens outcomes. 连续暴露时间。长时间屏幕使用或身体压力会加重影响。" />
          </label>
          <select value={duration} onChange={e => setDuration(Number(e.target.value))} className={selectClass}>
            {DURATION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label} — {o.labelCn}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className={labelClass}>
          Symptoms 症状
          <InfoTooltip text="Acute visual symptoms indicate possible retinal damage. Multiple symptoms compound the risk score. 急性视觉症状表明可能存在视网膜损伤。多种症状会加剧风险评分。" />
        </label>
        <div className="flex flex-wrap gap-5 mt-2">
          {[
            { label: "Floaters 飞蚊症", checked: floaters, set: setFloaters },
            { label: "Flashes 闪光感", checked: flashes, set: setFlashes },
            { label: "Pain 疼痛", checked: pain, set: setPain },
            { label: "Vision Loss 视力下降", checked: visionLoss, set: setVisionLoss },
          ].map(s => (
            <label key={s.label} className="flex items-center gap-2 text-foreground text-sm cursor-pointer">
              <input type="checkbox" checked={s.checked} onChange={e => s.set(e.target.checked)} className={checkClass} />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      {(statusMessage || simulating) && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          {simulating && (
            <div className="mb-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "70%" }} />
            </div>
          )}
          <p className="font-mono text-xs text-muted-foreground break-words whitespace-pre-line">{statusMessage}</p>
        </div>
      )}

      <button onClick={handleSubmit} disabled={loading || !address} className="mt-5 w-full py-3 rounded-lg font-mono text-sm tracking-wider uppercase border border-magenta/50 bg-magenta/10 text-magenta hover:bg-magenta/20 transition-all disabled:opacity-50">
        {loading ? "Processing... 处理中..." : "Submit Risk Event 提交风险事件"}
      </button>

      {riskScore !== null && (
        <div className={`mt-4 p-4 rounded-lg border ${alertLevel === "CRITICAL" ? "border-destructive bg-destructive/10" : alertLevel === "WARNING" ? "border-amber bg-amber/10" : "border-neon-green bg-neon-green/10"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs text-muted-foreground">PERSONALIZED RISK SCORE 个性化风险评分</p>
              <p className="font-heading text-4xl font-black mt-1" style={{ color: alertLevel === "CRITICAL" ? "hsl(var(--destructive))" : alertLevel === "WARNING" ? "hsl(var(--amber))" : "hsl(var(--green))" }}>{riskScore}</p>
            </div>
            <span className={`font-mono text-sm px-3 py-1 rounded border ${alertLevel === "CRITICAL" ? "text-destructive border-destructive" : alertLevel === "WARNING" ? "text-amber border-amber" : "text-neon-green border-neon-green"}`}>
              {alertLevel === "CRITICAL" ? "CRITICAL 危急" : alertLevel === "WARNING" ? "WARNING 警告" : "NORMAL 正常"}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted/50 rounded p-2">
              <p className="font-mono text-[10px] text-muted-foreground">ACCEL 加速</p>
              <p className="font-heading text-sm text-foreground">{accel}</p>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <p className="font-mono text-[10px] text-muted-foreground">POSTURE 姿态</p>
              <p className="font-heading text-sm text-foreground">{posture}</p>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <p className="font-mono text-[10px] text-muted-foreground">DURATION 时长</p>
              <p className="font-heading text-sm text-foreground">{duration}</p>
            </div>
          </div>
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
