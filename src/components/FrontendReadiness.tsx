import { ethers } from "ethers";

interface Props {
  address: string;
  isFuji: boolean;
  contract: ethers.Contract | null;
}

export default function FrontendReadiness({ address, isFuji, contract }: Props) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
        Frontend Readiness 前端就绪度
      </p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Wallet</p>
          <p className="font-mono text-sm mt-2">{address ? "Connected 已连接" : "Not connected 未连接"}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Network</p>
          <p className="font-mono text-sm mt-2">{isFuji ? "Fuji 已连接" : "Not on Fuji 非 Fuji"}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">EvidenceRewards</p>
          <p className="font-mono text-sm mt-2">{contract ? "Ready 已就绪" : "Null 未就绪"}</p>
        </div>
      </div>
    </section>
  );
}