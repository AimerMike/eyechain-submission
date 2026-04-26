import { useState } from "react";
import { Link } from "react-router-dom";
import EvidenceUpload from "@/components/EvidenceUpload";
import FrontendReadiness from "@/components/FrontendReadiness";
import MainActionRail from "@/components/MainActionRail";
import MainModuleGrid from "@/components/MainModuleGrid";
import PrivacySettings from "@/components/PrivacySettings";
import RewardsPanel from "@/components/RewardsPanel";
import SystemBanner from "@/components/SystemBanner";
import UserRegistration from "@/components/UserRegistration";
import { useWallet } from "@/lib/useWallet";

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

  const refresh = () => setRefreshKey((value) => value + 1);

  return (
    <div
      className="min-h-screen text-white"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(34,211,238,0.14), transparent 22%), radial-gradient(circle at top right, rgba(56,189,248,0.12), transparent 18%), linear-gradient(180deg, #020617 0%, #06101d 44%, #0b1f35 100%)",
      }}
    >
      <MainActionRail
        account={account}
        chainId={chainId}
        isFuji={isFuji}
        onConnect={connectWallet}
        onSwitchNetwork={switchToFuji}
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        <section className="rounded-[34px] border border-cyan-300/15 bg-slate-950/55 px-6 py-6 shadow-[0_20px_80px_rgba(3,10,24,0.35)] backdrop-blur md:px-8 md:py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-100/65">
                Protocol status
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-6xl">
                Contributor Appraisal MVP
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                Start with contribution and evidence. Move into cohort licensing and
                recovery missions when the record is ready.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
              <div className="rounded-2xl border border-cyan-300/15 bg-slate-900/60 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">
                  Phase
                </p>
                <p className="mt-3 text-lg text-white">M1 live wiring</p>
              </div>

              <div className="rounded-2xl border border-cyan-300/15 bg-slate-900/60 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">
                  Network
                </p>
                <p className="mt-3 text-lg text-white">Avalanche Fuji</p>
              </div>

              <div className="rounded-2xl border border-cyan-300/15 bg-slate-900/60 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">
                  Next
                </p>
                <p className="mt-3 text-lg text-white">M2 / M3 expansion</p>
              </div>
            </div>
          </div>
        </section>

        <MainModuleGrid account={account} isFuji={isFuji} />

        <section
          id="m1-live"
          className="rounded-[32px] border border-cyan-300/15 bg-slate-950/55 p-5 shadow-[0_20px_70px_rgba(3,10,24,0.35)] backdrop-blur"
        >
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-100/65">
                M1 live
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                Register, submit, and track reward
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/m2"
                className="rounded-2xl border border-cyan-300/25 bg-cyan-400/5 px-4 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-400/10"
              >
                Open M2
              </Link>
              <Link
                to="/m3"
                className="rounded-2xl border border-cyan-300/25 bg-cyan-400/5 px-4 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-400/10"
              >
                Open M3
              </Link>
            </div>
          </div>

          <div className="space-y-6">
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
          </div>
        </section>
      </main>
    </div>
  );
}