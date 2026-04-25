import { Link } from "react-router-dom";
import { useState } from "react";
import { useWallet } from "@/lib/useWallet";
import { shortenAddress } from "@/lib/contract";
import SharedEvidenceInventory from "@/components/m2/SharedEvidenceInventory";
import CohortManagerPanel from "@/components/m2/CohortManagerPanel";
import CohortPurchasePanel from "@/components/m2/CohortPurchasePanel";

export default function M2() {
  const {
    account,
    chainId,
    isFuji,
    connectWallet,
    switchToFuji,
    mockUsdcContract,
    evidenceRewardsContract,
    cohortExchangeContract,
  } = useWallet();

  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((v) => v + 1);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-heading text-2xl tracking-wider">EYECHAIN</p>
            <p className="font-mono text-xs text-muted-foreground tracking-widest mt-1">
              M2 Cohort Licensing Exchange · 后台分组授权与购买
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
            >
              Back to M1 返回 M1
            </Link>

            {!account ? (
              <button
                onClick={connectWallet}
                className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all"
              >
                Connect Wallet 连接钱包
              </button>
            ) : !isFuji ? (
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-border text-muted-foreground">
                  {shortenAddress(account)}
                </div>
                <button
                  onClick={switchToFuji}
                  className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                >
                  Switch to Fuji 切到 Fuji
                </button>
              </div>
            ) : (
              <>
                <div className="text-right">
                  <p className="font-mono text-[10px] text-muted-foreground tracking-widest">
                    NETWORK
                  </p>
                  <p className="font-mono text-xs text-primary">
                    {chainId ? `Chain ${chainId}` : "Not connected"}
                  </p>
                </div>

                <div className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary whitespace-nowrap">
                  {shortenAddress(account)}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
            M2 Overview
          </p>
          <h1 className="font-heading text-4xl mt-3">Cohort Licensing Exchange</h1>
          <p className="text-sm text-muted-foreground mt-3 leading-7">
            这一页是 EyeChain 的 M2：把已经共享、已经审核过的用户 evidence，
            组织成 cohort 级别的数据产品，由研究方 / 机构买家购买 license。
            流程是：管理员创建 cohort → 加入 evidence → 买家先授权 USDC → 再购买 license。
          </p>
        </section>

        <SharedEvidenceInventory
          evidenceContract={evidenceRewardsContract}
          refreshKey={refreshKey}
        />

        <CohortManagerPanel
          cohortContract={cohortExchangeContract}
          address={account}
          isFuji={isFuji}
          refreshKey={refreshKey}
          onRefresh={refresh}
        />

        <CohortPurchasePanel
          cohortContract={cohortExchangeContract}
          mockUsdcContract={mockUsdcContract}
          address={account}
          isFuji={isFuji}
          refreshKey={refreshKey}
          onRefresh={refresh}
        />
      </main>
    </div>
  );
}