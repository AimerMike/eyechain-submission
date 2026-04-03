import { useState } from "react";
import { ethers } from "ethers";
import DashboardPanel from "./DashboardPanel";
import { FUJI_EXPLORER } from "@/lib/contract";

interface Props {
  contract: ethers.Contract | null;
  address: string | null;
}

export default function UserRegistration({ contract, address }: Props) {
  const [vulnScore, setVulnScore] = useState(50);
  const [baselineRisk, setBaselineRisk] = useState("Medium");
  const [retinalHistory, setRetinalHistory] = useState(false);
  const [surgeryInfo, setSurgeryInfo] = useState("No");
  const [laserCount, setLaserCount] = useState(0);
  const [sharingLevel, setSharingLevel] = useState("None");
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!contract || !address) return alert("Connect wallet first / 请先连接钱包");
    setLoading(true);
    try {
      const postOp = surgeryInfo !== "No";
      const tx = await contract.registerProfile(vulnScore, postOp);
      setTxHash(tx.hash);
      await tx.wait();
      alert("Registration successful! / 注册成功！");
    } catch (err: any) {
      console.error(err);
      alert(err.reason || err.message || "Registration failed / 注册失败");
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-foreground font-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary";
  const inputClass = selectClass;
  const labelClass = "block font-mono text-xs text-muted-foreground tracking-wider uppercase mb-1.5";

  return (
    <DashboardPanel title="User Registration" titleCn="用户注册" tag="01 · Register 注册" tagColor="cyan">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Vulnerability Score (0-100)<br/>脆弱性评分 (0-100)</label>
          <input type="number" min={0} max={100} value={vulnScore} onChange={e => setVulnScore(Number(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Baseline Risk<br/>基线风险</label>
          <select value={baselineRisk} onChange={e => setBaselineRisk(e.target.value)} className={selectClass}>
            <option>Low 低</option><option>Medium 中</option><option>High 高</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Retinal History<br/>视网膜病史</label>
          <select value={retinalHistory ? "Yes" : "No"} onChange={e => setRetinalHistory(e.target.value.startsWith("Yes"))} className={selectClass}>
            <option>No 否</option><option>Yes 是</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Surgery Info<br/>手术信息</label>
          <select value={surgeryInfo} onChange={e => setSurgeryInfo(e.target.value)} className={selectClass}>
            <option>No</option><option>External 外路</option><option>Internal 内路</option><option>ICL</option><option>LASIK</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Laser Treatment Count<br/>激光治疗次数</label>
          <input type="number" min={0} value={laserCount} onChange={e => setLaserCount(Number(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Data Sharing Level<br/>数据共享级别</label>
          <select value={sharingLevel} onChange={e => setSharingLevel(e.target.value)} className={selectClass}>
            <option>None 无</option><option>Research 研究</option><option>Healthcare 医疗</option><option>Public 公开</option>
          </select>
        </div>
      </div>
      <button onClick={handleRegister} disabled={loading || !address} className="mt-5 w-full py-3 rounded-lg font-mono text-sm tracking-wider uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50">
        {loading ? "Submitting... 提交中..." : "Register on Blockchain 注册上链"}
      </button>
      {txHash && (
        <div className="mt-3 p-3 bg-muted rounded-lg">
          <p className="font-mono text-xs text-muted-foreground">TX Hash 交易哈希:</p>
          <a href={`${FUJI_EXPLORER}/tx/${txHash}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-primary break-all hover:underline">{txHash}</a>
        </div>
      )}
    </DashboardPanel>
  );
}
