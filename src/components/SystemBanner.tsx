import { APP_STATUS } from "@/lib/appContext";

export default function SystemBanner() {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
        Protocol Status 协议状态
      </p>
      <h1 className="font-heading text-3xl mt-2">Contributor Appraisal MVP</h1>
      <p className="text-sm text-muted-foreground mt-3 leading-7">
        这页优先承载真实 Fuji 主流程：连接钱包、切换网络、注册贡献者、设置隐私、提交证据、读取奖励状态。
      </p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Phase</p>
          <p className="font-mono text-sm mt-2">{APP_STATUS.phase}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Network</p>
          <p className="font-mono text-sm mt-2">{APP_STATUS.network}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Chain ID</p>
          <p className="font-mono text-sm mt-2">{APP_STATUS.chainId}</p>
        </div>
      </div>
    </section>
  );
}