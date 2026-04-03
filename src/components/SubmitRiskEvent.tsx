import { useState } from "react";
import { ethers } from "ethers";
import DashboardPanel from "./DashboardPanel";
import { FUJI_EXPLORER, symptomsToFlag } from "@/lib/contract";

interface Props {
  contract: ethers.Contract | null;
  address: string | null;
}

export default function SubmitRiskEvent({ contract, address }: Props) {
  const [accel, setAccel] = useState(0);
  const [posture, setPosture] = useState(0);
  const [duration, setDuration] = useState(0);
  const [floaters, setFloaters] = useState(false);
  const [flashes, setFlashes] = useState(false);
  const [pain, setPain] = useState(false);
  const [visionLoss, setVisionLoss] = useState(false);
  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("");
  const [txHash, setTxHash] = useState("");
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const computeLocalRisk = () => {
    return Math.round((25 * accel + 20 * posture + 20 * duration + 25 * 50 + 10 * symptomsToFlag(floaters, flashes, pain, visionLoss)) / 100);
  };

  const handleSubmit = async () => {
    if (!contract || !address) return alert("Connect wallet first / 请先连接钱包");
    setLoading(true);
    try {
      const symptoms = symptomsToFlag(floaters, flashes, pain, visionLoss);
      const tx = await contract.submitRiskEvent(accel, posture, duration, symptoms);
      setTxHash(tx.hash);
      const receipt = await tx.wait();
      const score = computeLocalRisk();
      setRiskScore(score);
      console.log("Risk event submitted, receipt:", receipt);
    } catch (err: any) {
      console.error(err);
      alert(err.reason || err.message || "Submission failed / 提交失败");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-foreground font-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary";
  const labelClass = "block font-mono text-xs text-muted-foreground tracking-wider uppercase mb-1.5";
  const checkClass = "w-4 h-4 accent-cyan rounded";

  const alertLevel = riskScore !== null ? (riskScore >= 85 ? "CRITICAL" : riskScore >= 70 ? "WARNING" : "NORMAL") : null;

  return (
    <DashboardPanel title="Submit Risk Event" titleCn="提交风险事件" tag="02 · Risk Event 风险事件" tagColor="magenta">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Acceleration Load<br/>加速度负荷</label>
          <input type="number" min={0} max={100} value={accel} onChange={e => setAccel(Number(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Posture Load<br/>姿态负荷</label>
          <input type="number" min={0} max={100} value={posture} onChange={e => setPosture(Number(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Duration Score<br/>持续时间评分</label>
          <input type="number" min={0} max={100} value={duration} onChange={e => setDuration(Number(e.target.value))} className={inputClass} />
        </div>
      </div>

      <div className="mt-4">
        <label className={labelClass}>Symptoms 症状</label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className={labelClass}>Activity Type<br/>活动类型</label>
          <input type="text" value={activity} onChange={e => setActivity(e.target.value)} placeholder="e.g. Running 跑步, Yoga 瑜伽" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Location<br/>位置</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Gym 健身房, Home 家" className={inputClass} />
        </div>
      </div>

      <button onClick={handleSubmit} disabled={loading || !address} className="mt-5 w-full py-3 rounded-lg font-mono text-sm tracking-wider uppercase border border-magenta/50 bg-magenta/10 text-magenta hover:bg-magenta/20 transition-all disabled:opacity-50">
        {loading ? "Submitting... 提交中..." : "Submit Risk Event 提交风险事件"}
      </button>

      {riskScore !== null && (
        <div className={`mt-4 p-4 rounded-lg border ${alertLevel === "CRITICAL" ? "border-destructive bg-destructive/10" : alertLevel === "WARNING" ? "border-amber bg-amber/10" : "border-neon-green bg-neon-green/10"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs text-muted-foreground">TOTAL RISK SCORE 总风险评分</p>
              <p className="font-heading text-4xl font-black mt-1" style={{ color: alertLevel === "CRITICAL" ? "hsl(var(--destructive))" : alertLevel === "WARNING" ? "hsl(var(--amber))" : "hsl(var(--green))" }}>{riskScore}</p>
            </div>
            <span className={`font-mono text-sm px-3 py-1 rounded border ${alertLevel === "CRITICAL" ? "text-destructive border-destructive" : alertLevel === "WARNING" ? "text-amber border-amber" : "text-neon-green border-neon-green"}`}>
              {alertLevel === "CRITICAL" ? "CRITICAL 危急" : alertLevel === "WARNING" ? "WARNING 警告" : "NORMAL 正常"}
            </span>
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
