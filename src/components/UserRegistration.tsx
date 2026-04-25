import { useEffect, useState } from "react";
import { ethers } from "ethers";

interface Props {
  contract: ethers.Contract | null;
  address: string;
  isFuji: boolean;
  onRegistered?: () => void;
}

const PRIVACY_OPTIONS = [
  { value: 0, label: "Private 完全私密" },
  { value: 1, label: "Open 默认共享" },
  { value: 2, label: "Negotiable 每次询问" },
];

const SAFE_DEFAULT_BOND_WEI = "100000000000";

export default function UserRegistration({
  contract,
  address,
  isFuji,
  onRegistered,
}: Props) {
  const [privacyMode, setPrivacyMode] = useState(2);
  const [bondWei, setBondWei] = useState<string>(SAFE_DEFAULT_BOND_WEI);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    const loadBond = async () => {
      setBondWei(SAFE_DEFAULT_BOND_WEI);

      if (!contract) {
        setMessage("Contract not ready yet / 合约实例尚未就绪");
        return;
      }

      try {
        if (typeof (contract as any).registerBondWei === "function") {
          const v = await (contract as any).registerBondWei();
          const value = v?.toString?.() || SAFE_DEFAULT_BOND_WEI;
          setBondWei(value);
        } else {
          setMessage("registerBondWei() not found / 合约缺少 registerBondWei()");
        }
      } catch (err: any) {
        setBondWei(SAFE_DEFAULT_BOND_WEI);
        setMessage(
          err?.reason ||
            err?.data?.message ||
            err?.message ||
            "Failed to read bond from contract / 读取保证金失败"
        );
      }
    };

    loadBond();
  }, [contract]);

  const handleRegister = async () => {
    setMessage("");
    setTxHash("");

    if (!address) {
      setMessage("Please connect wallet first / 请先连接钱包");
      return;
    }

    if (!isFuji) {
      setMessage("Please switch to Avalanche Fuji / 请切换到 Avalanche Fuji");
      return;
    }

    if (!contract) {
      setMessage(
        "EvidenceRewards contract is null in frontend / 前端里的 EvidenceRewards 合约实例是 null"
      );
      return;
    }

    setLoading(true);

    try {
      if (typeof (contract as any).contributors === "function") {
        const contributor = await (contract as any).contributors(address);
        if (contributor?.registered) {
          setMessage("This wallet is already registered / 当前钱包已注册");
          setLoading(false);
          return;
        }
      }

      if (typeof (contract as any).register !== "function") {
        throw new Error("register() not found on current contract");
      }

      const tx = await (contract as any).register(privacyMode, {
        value: bondWei,
      });

      setTxHash(tx.hash);
      setMessage("Registration submitted / 注册交易已提交");
      await tx.wait();
      setMessage("Registration successful / 注册成功");
      onRegistered?.();
    } catch (err: any) {
      const msg =
        err?.reason ||
        err?.data?.message ||
        err?.message ||
        "Registration failed / 注册失败";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const contractReady = !!contract;

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
        01 · Register 注册
      </p>

      <h2 className="font-heading text-2xl mt-2">Contributor Registration</h2>

      <p className="text-sm text-muted-foreground mt-2">
        新注册走 Fuji 上的 EvidenceRewards.register(privacyMode)。
        需要支付参与保证金。
      </p>

      <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
          Frontend Readiness 前端状态
        </p>
        <p className="font-mono text-sm mt-2">
          Wallet: {address ? "Connected 已连接" : "Not connected 未连接"}
        </p>
        <p className="font-mono text-sm mt-1">
          Network: {isFuji ? "Fuji 已连接" : "Not on Fuji 非 Fuji"}
        </p>
        <p className="font-mono text-sm mt-1">
          Contract: {contractReady ? "Ready 已就绪" : "Null 未就绪"}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <label className="block font-mono text-xs text-muted-foreground tracking-wider uppercase mb-2">
            Privacy Mode 隐私模式
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

        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Registration Bond 注册保证金
          </p>
          <p className="font-mono text-sm mt-2 break-all">{bondWei} wei</p>
          <p className="text-xs text-muted-foreground mt-2">
            预计约 {Number(ethers.utils.formatEther(bondWei)).toFixed(7)} AVAX
          </p>
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full py-3 rounded-lg font-mono text-sm tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
        >
          {loading ? "Registering... 注册中..." : "Register on Fuji 在 Fuji 注册"}
        </button>

        {message && (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="font-mono text-xs break-words whitespace-pre-wrap">
              {message}
            </p>
          </div>
        )}

        {txHash && (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
              TX HASH
            </p>
            <p className="font-mono text-xs break-all mt-2">{txHash}</p>
          </div>
        )}
      </div>
    </section>
  );
}