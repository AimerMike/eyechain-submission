import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useWallet } from "@/lib/useWallet";
import { shortenAddress, DEPLOYER_ADDRESS } from "@/lib/contract";
import SponsorMissionPanel from "@/components/m3/SponsorMissionPanel";
import MissionBoard from "@/components/m3/MissionBoard";
import MissionActionPanel from "@/components/m3/MissionActionPanel";
import ReviewMissionPanel from "@/components/m3/ReviewMissionPanel";

export default function M3() {
  const {
    account,
    chainId,
    isFuji,
    connectWallet,
    switchToFuji,
    mockUsdcContract,
    evidenceRewardsContract,
    recoveryMissionsContract,
  } = useWallet();

  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((v) => v + 1);

  const isAdmin =
    !!account && account.toLowerCase() === DEPLOYER_ADDRESS.toLowerCase();

  const roleLabel = useMemo(() => {
    if (!account) return "Not connected / 未连接";
    if (!isFuji) return "Wrong network / 网络不对";
    if (isAdmin) return "Sponsor + Reviewer + Contributor";
    return "Contributor / Participant";
  }, [account, isFuji, isAdmin]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-heading text-2xl tracking-wider">EYECHAIN</p>
            <p className="font-mono text-xs text-muted-foreground tracking-widest mt-1">
              M3 Sponsored Recovery Missions · 任务 / 证明 / 审核 / 奖励
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
            >
              Back to M1 返回 M1
            </Link>

            <Link
              to="/m2"
              className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
            >
              M2 Cohort Exchange
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
            M3 Overview
          </p>
          <h1 className="font-heading text-4xl mt-3">
            Sponsored Recovery Missions
          </h1>
          <p className="text-sm text-muted-foreground mt-3 leading-7">
            M3 把 EyeChain 从“证据提交与授权”推进到“任务干预与结果回流”。
            sponsor 创建 mission 并预存预算，参与者 join mission，提交 proof，
            reviewer/sponsor 审核 milestone，通过后奖励进入 registry，再回到 contributor 的 claimable reward。
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Current Role
              </p>
              <p className="font-mono text-sm mt-2">{roleLabel}</p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Sponsor Flow
              </p>
              <p className="font-mono text-xs mt-2 leading-6 text-muted-foreground">
                1. Approve USDC
                <br />
                2. Create mission
                <br />
                3. Fund budget
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Contributor Flow
              </p>
              <p className="font-mono text-xs mt-2 leading-6 text-muted-foreground">
                1. Join mission
                <br />
                2. Submit proof
                <br />
                3. Wait for approval
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Reviewer Flow
              </p>
              <p className="font-mono text-xs mt-2 leading-6 text-muted-foreground">
                1. Review proof
                <br />
                2. Approve milestone
                <br />
                3. Reward enters registry
              </p>
            </div>
          </div>
        </section>

        <SponsorMissionPanel
          missionContract={recoveryMissionsContract}
          mockUsdcContract={mockUsdcContract}
          address={account}
          isFuji={isFuji}
          refreshKey={refreshKey}
          onRefresh={refresh}
        />

        <MissionBoard
          missionContract={recoveryMissionsContract}
          address={account}
          refreshKey={refreshKey}
        />

        <MissionActionPanel
          missionContract={recoveryMissionsContract}
          address={account}
          isFuji={isFuji}
          refreshKey={refreshKey}
          onRefresh={refresh}
        />

        <ReviewMissionPanel
          missionContract={recoveryMissionsContract}
          address={account}
          isFuji={isFuji}
          refreshKey={refreshKey}
          onRefresh={refresh}
        />

        <section className="rounded-2xl border border-border bg-card p-5">
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
            Registry Linkage
          </p>
          <h2 className="font-heading text-2xl mt-2">Reward Registry Integration</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-7">
            当前 M3 合约不会直接把钱打到用户钱包，而是先把 milestone reward 转到 registry
            （EvidenceRewards），再通过 registry.creditReward(...) 增加用户的 claimable。
            所以 M3 奖励要回到 M1 的 Rewards & State 区块里 claim。
          </p>

          <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
            <p className="font-mono text-xs">
              Registry contract connected:{" "}
              {evidenceRewardsContract ? "Yes 已连接" : "No 未连接"}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}