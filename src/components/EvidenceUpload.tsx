import { useEffect, useState } from "react";
import { ethers } from "ethers";

interface Props {
  contract: ethers.Contract | null;
  address: string;
  isFuji: boolean;
  refreshKey?: number;
  onSubmitted?: () => void;
}

const DATA_CLASS_OPTIONS = [
  { value: 0, label: "Subjective Monthly 主观月度数据" },
  { value: 1, label: "Exam Report 检查报告" },
  { value: 2, label: "Inspection Report 检验报告" },
  { value: 3, label: "Minor Surgery 小手术" },
  { value: 4, label: "Major Surgery 大手术" },
];

export default function EvidenceUpload({
  contract,
  address,
  isFuji,
  refreshKey,
  onSubmitted,
}: Props) {
  const [registered, setRegistered] = useState(false);
  const [dataClass, setDataClass] = useState(1);
  const [shareNow, setShareNow] = useState(true);
  const [contentText, setContentText] = useState("");
  const [metadataText, setMetadataText] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setMessage("");

      if (!contract || !address) {
        setRegistered(false);
        return;
      }

      try {
        const profile = await (contract as any).profiles(address);
        setRegistered(Boolean(profile?.registered));
      } catch (err: any) {
        setRegistered(false);
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

  const handleSubmit = async () => {
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
      setMessage("EvidenceRewards contract unavailable / EvidenceRewards 合约不可用");
      return;
    }

    if (!contentText.trim()) {
      setMessage("Content summary is required / 证据摘要不能为空");
      return;
    }

    setLoading(true);

    try {
      const fileHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(contentText.trim())
      );

      const metadataHash = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(
          metadataText.trim() || `class:${dataClass};share:${shareNow}`
        )
      );

      const tx = await (contract as any).submitEvidence(
        dataClass,
        fileHash,
        metadataHash,
        shareNow
      );

      setTxHash(tx.hash);
      setMessage("Evidence submitted / 证据提交交易已发送");
      await tx.wait();
      setMessage("Evidence submitted successfully / 证据提交成功");
      setContentText("");
      setMetadataText("");
      onSubmitted?.();
    } catch (err: any) {
      const msg =
        err?.reason ||
        err?.data?.message ||
        err?.message ||
        "Evidence submission failed / 证据提交失败";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
        03 · Evidence Upload 证据上传
      </p>
      <h2 className="font-heading text-2xl mt-2">Submit Hashed Evidence</h2>
      <p className="text-sm text-muted-foreground mt-2">
        当前前端先把文字摘要和元数据做哈希后上链，不直接把敏感原文写入链上。
      </p>

      <div className="mt-5 space-y-4">
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
            Registration Status
          </p>
          <p
            className={`font-mono text-sm mt-2 ${
              registered ? "text-primary" : "text-destructive"
            }`}
          >
            {registered ? "Registered 已注册" : "Not registered 未注册"}
          </p>
        </div>

        <div>
          <label className="block font-mono text-xs text-muted-foreground tracking-wider uppercase mb-2">
            Data Class 数据类别
          </label>
          <select
            value={dataClass}
            onChange={(e) => setDataClass(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-muted px-4 py-3"
          >
            {DATA_CLASS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-mono text-xs text-muted-foreground tracking-wider uppercase mb-2">
            Content Summary 内容摘要
          </label>
          <textarea
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            rows={5}
            placeholder="例如：2026-04 annual high-myopia exam, OCT stable, fundus photo attached..."
            className="w-full rounded-lg border border-border bg-muted px-4 py-3"
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-muted-foreground tracking-wider uppercase mb-2">
            Metadata Summary 元数据摘要
          </label>
          <textarea
            value={metadataText}
            onChange={(e) => setMetadataText(e.target.value)}
            rows={3}
            placeholder="例如：hospital, exam date, tags: retina/myopia/post-op"
            className="w-full rounded-lg border border-border bg-muted px-4 py-3"
          />
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={shareNow}
            onChange={(e) => setShareNow(e.target.checked)}
            className="w-4 h-4"
          />
          <span>Share this upload now / 本次上传立即授权共享</span>
        </label>

        <button
          onClick={handleSubmit}
          disabled={loading || !address || !isFuji || !contract}
          className="w-full py-3 rounded-lg font-mono text-sm tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
        >
          {loading ? "Submitting... 提交中..." : "Submit Evidence 提交证据"}
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