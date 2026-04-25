import { useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@/lib/useWallet";
import { shortenAddress } from "@/lib/contract";
import SystemBanner from "@/components/SystemBanner";
import FrontendReadiness from "@/components/FrontendReadiness";
import UserRegistration from "@/components/UserRegistration";
import PrivacySettings from "@/components/PrivacySettings";
import EvidenceUpload from "@/components/EvidenceUpload";
import RewardsPanel from "@/components/RewardsPanel";

export default function Index() {
  const {
    account,
    chainId,
    isFuji,
    connectWallet,
    switchToFuji,
    evidenceRewardsContract,
  } = useWallet();

  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((v) => v + 1);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="font-heading text-2xl tracking-wider">EYECHAIN</p>
            <p className="font-mono text-xs text-muted-foreground tracking-widest">
              Fuji M1 Contributor Flow · 注册 / 上传 / 奖励
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Link
              to="/m2"
              className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all whitespace-nowrap"
            >
              M2 Cohort
            </Link>

            <Link
              to="/m3"
              className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all whitespace-nowrap"
            >
              M3 Missions
            </Link>

            <Link
              to="/rework"
              className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all whitespace-nowrap"
            >
              Rework V2
            </Link>

            <Link
              to="/legacy"
              className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all whitespace-nowrap"
            >
              Legacy Dashboard
            </Link>

            <div className="text-right min-w-[88px]">
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest">
                NETWORK
              </p>
              <p
                className={`font-mono text-xs ${
                  isFuji ? "text-primary" : "text-destructive"
                }`}
              >
                {chainId ? `Chain ${chainId}` : "Not connected"}
              </p>
            </div>

            {!account ? (
              <button
                onClick={connectWallet}
                className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all whitespace-nowrap"
              >
                Connect Wallet
              </button>
            ) : !isFuji ? (
              <div className="flex items-center gap-2">
                <div className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-border text-muted-foreground whitespace-nowrap">
                  {shortenAddress(account)}
                </div>
                <button
                  onClick={switchToFuji}
                  className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all whitespace-nowrap"
                >
                  Switch to Fuji
                </button>
              </div>
            ) : (
              <div className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary whitespace-nowrap">
                {shortenAddress(account)}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <SystemBanner />

        <FrontendReadiness
          address={account}
          isFuji={isFuji}
          contract={evidenceRewardsContract}
        />

        <UserRegistration
          address={account}
          isFuji={isFuji}
          contract={evidenceRewardsContract}
          onRegistered={refresh}
        />

        <PrivacySettings
          address={account}
          isFuji={isFuji}
          contract={evidenceRewardsContract}
          refreshKey={refreshKey}
          onUpdated={refresh}
        />

        <EvidenceUpload
          address={account}
          isFuji={isFuji}
          contract={evidenceRewardsContract}
          refreshKey={refreshKey}
          onSubmitted={refresh}
        />

        <RewardsPanel
          address={account}
          isFuji={isFuji}
          contract={evidenceRewardsContract}
          refreshKey={refreshKey}
          onRefresh={refresh}
        />
      </main>
    </div>
  );
}