import { useEffect, useState } from "react";
import { ethers } from "ethers";

interface Props {
  contract: ethers.Contract | null;
  address: string;
  isFuji: boolean;
  refreshKey?: number;
  onUpdated?: () => void;
}

const PRIVACY_OPTIONS = [
  { value: 0, label: "Private 完全私密" },
  { value: 1, label: "Open 默认共享" },
  { value: 2, label: "Negotiable 每次询问" },
];

export default function PrivacySettings({
  contract,
  address,
  isFuji,
  refreshKey,
  onUpdated,
}: Props) {
  const [privacyMode, setPrivacyMode] = useState(2);
  const [registered, setRegistered] = useState(false);
  const [bondRefunded, setBondRefunded] = useState(false);
  const [registeredAt, setRegisteredAt] = useState("0");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setMessage("");

      if (!contract || !address) {
        setRegistered(false);
        setBondRefunded(false);
        setRegisteredAt("0");
        return;
      }

      try {
        const profile = await (contract as any).profiles(address);
        const isRegistered = Boolean(profile?.registered);

        setRegistered(isRegistered);
        setPrivacyMode(Number(profile?.mode ?? 2));
        setBondRefunded(Boolean(profile?.bondRefunded));
        setRegisteredAt(profile?.registeredAt?.toString?.() ?? "0");
      } catch (err: any) {
        setRegistered(false);
        setBondRefunded(false);
        setRegisteredAt("0");
        setMessage(
          err?.reason ||
            err?.data?.message ||
            err?.message ||
            "Failed to load profile / 读取 profile 失败"
        );
      }
    };

    load();
  }, [contract, address, refreshKey]);

  const handleUpdate = async () => {
    setMessage("");

    if (!address) {
      setMessage("Please connect wallet first / 请先连接钱包");
      return;
    }

    if (!isFuji) {
      setMessage("Please switch to Avalanche Fuji / 请切换到 Avalanche Fuji");
      return;
    }

    if (!contract) {
      setMessage("EvidenceRewards contract unavailable / EvidenceRewards 合约不可用");
      return;
    }

    setLoading(true);

    try {
      const tx = await (contract as any).setPrivacyMode(privacyMode);
      setMessage("Privacy update submitted / 隐私修改交易已提交");
      await tx.wait();
      setMessage("Privacy updated successfully / 隐私更新成功");
      onUpdated?.();
    } catch (err: any) {
      const msg =
        err?.reason ||
        err?.data?.message ||
        err?.message ||
        "Privacy update failed / 隐私更新失败";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
        02 · Privacy Settings 隐私设置
      </p>
      <h2 className="font-heading text-2xl mt-2">Future Upload Policy</h2>
      <p className="text-sm text-muted-foreground mt-2">
        这里修改的是未来上传的默认策略，不会回滚已经授出的历史许可。
      </p>

      <div className="mt-5 space-y-4">
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Registration Status 注册状态
          </p>
          <p
            className={`font-mono text-sm mt-2 ${
              registered ? "text-primary" : "text-destructive"
            }`}
          >
            {registered ? "Registered 已注册" : "Not registered 未注册"}
          </p>
          <p className="font-mono text-xs mt-2">
            Bond refunded: {bondRefunded ? "Yes 已退款" : "No 未退款"}
          </p>
          <p className="font-mono text-xs mt-1 break-all">
            Registered at: {registeredAt}
          </p>
        </div>

        <div>
          <label className="block font-mono text-xs text-muted-foreground tracking-wider uppercase mb-2">
            New Default Privacy 新默认隐私
          </label>
          <select
            value={privacyMode}
            onChange={(e) => setPrivacyMode(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-muted px-4 py-3"
          >
            {PRIVACY_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleUpdate}
          disabled={loading || !address || !isFuji || !contract}
          className="w-full py-3 rounded-lg font-mono text-sm tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
        >
          {loading ? "Updating... 更新中..." : "Update Privacy 更新隐私"}
        </button>

        {message && (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="font-mono text-xs break-words whitespace-pre-wrap">
              {message}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}