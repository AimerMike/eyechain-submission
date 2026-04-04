import { useState } from "react";
import { ethers } from "ethers";
import DashboardPanel from "./DashboardPanel";
import { FUJI_CHAIN_ID, ensureContractMethod, hasContractMethod } from "@/lib/contract";

interface Props {
  contract: ethers.Contract | null;
  address: string | null;
}

export default function AdminControls({ contract, address }: Props) {
  const [alertThresh, setAlertThresh] = useState(700);
  const [criticalThresh, setCriticalThresh] = useState(850);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const adminSupported = hasContractMethod(contract, "recalibrate");

  const handleRecalibrate = async () => {
    if (!contract) return;

    setLoading(true);
    setStatusMessage("");

    try {
      const currentContract = ensureContractMethod(contract, "recalibrate", "Admin recalibration");
      const network = await contract.provider.getNetwork();

      if (Number(network.chainId) !== FUJI_CHAIN_ID) {
        throw new Error("Please switch MetaMask to Avalanche Fuji (43113) / 请切换 MetaMask 到 Avalanche Fuji (43113)");
      }

      const tx = await currentContract.recalibrate(alertThresh, criticalThresh);
      await tx.wait();
      setStatusMessage("Thresholds updated successfully! / 阈值更新成功！");
      alert("Thresholds updated successfully! / 阈值更新成功！");
    } catch (err: any) {
      const message = err.reason || err.data?.message || err.message || "Failed — you may not have DAO_ROLE / 失败 — 您可能没有 DAO 权限";
      setStatusMessage(message);
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-muted border border-border rounded-lg px-4 py-2.5 text-foreground font-body focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary";
  const labelClass = "block font-mono text-xs text-muted-foreground tracking-wider uppercase mb-1.5";

  return (
    <DashboardPanel title="Admin / DAO Controls" titleCn="管理员 / DAO 控制" tag="07 · Admin 管理" tagColor="magenta">
      {!adminSupported && address && (
        <div className="mb-4 p-3 bg-amber/10 border border-amber/30 rounded-lg">
          <p className="font-mono text-xs text-amber">Current deployed contract ABI does not include recalibrate / DAO admin functions<br/>当前已部署合约 ABI 未包含 recalibrate / DAO 管理函数</p>
        </div>
      )}

      <p className="text-muted-foreground text-sm mb-4 font-mono">Requires DAO_ROLE on the smart contract<br/>需要智能合约上的 DAO_ROLE 权限</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>Alert Threshold<br/>警报阈值</label>
          <input type="number" value={alertThresh} onChange={e => setAlertThresh(Number(e.target.value))} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Critical Threshold<br/>危急阈值</label>
          <input type="number" value={criticalThresh} onChange={e => setCriticalThresh(Number(e.target.value))} className={inputClass} />
        </div>
      </div>

      {statusMessage && (
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p className="font-mono text-xs text-muted-foreground break-words">{statusMessage}</p>
        </div>
      )}

      <button onClick={handleRecalibrate} disabled={loading || !address || !adminSupported} className="w-full py-3 rounded-lg font-mono text-sm tracking-wider uppercase border border-magenta/50 bg-magenta/10 text-magenta hover:bg-magenta/20 transition-all disabled:opacity-50">
        {loading ? "Updating... 更新中..." : "Update Thresholds (DAO) 更新阈值"}
      </button>
    </DashboardPanel>
  );
}
