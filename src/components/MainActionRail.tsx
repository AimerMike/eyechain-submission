import { Link } from "react-router-dom";
import { shortenAddress } from "@/lib/contract";

interface Props {
  account: string;
  chainId: number | null;
  isFuji: boolean;
  onConnect: () => void | Promise<void>;
  onSwitchNetwork: () => void | Promise<void>;
}

export default function MainActionRail({
  account,
  chainId,
  isFuji,
  onConnect,
  onSwitchNetwork,
}: Props) {
  return (
    <nav className="sticky top-0 z-50 border-b border-cyan-400/20 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-3xl font-semibold tracking-[0.08em] text-white">
            EYECHAIN
          </p>
          <p className="mt-1 text-sm tracking-[0.28em] text-cyan-100/70">
            Evidence · Cohort · Mission
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/m2"
            className="rounded-2xl border border-cyan-300/25 bg-cyan-400/5 px-4 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-400/10"
          >
            M2 Cohort
          </Link>

          <Link
            to="/m3"
            className="rounded-2xl border border-cyan-300/25 bg-cyan-400/5 px-4 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-400/10"
          >
            M3 Missions
          </Link>

          <Link
            to="/rework"
            className="rounded-2xl border border-cyan-300/25 bg-cyan-400/5 px-4 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-400/10"
          >
            Rework V2
          </Link>

          <Link
            to="/legacy"
            className="rounded-2xl border border-cyan-300/25 bg-cyan-400/5 px-4 py-2.5 text-sm text-cyan-100 transition hover:bg-cyan-400/10"
          >
            Legacy
          </Link>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-right">
            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">
              Network
            </p>
            <p className={`text-sm ${isFuji ? "text-cyan-200" : "text-rose-300"}`}>
              {chainId ? `Chain ${chainId}` : "Not connected"}
            </p>
          </div>

          {!account ? (
            <button
              onClick={onConnect}
              className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-5 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
            >
              Connect Wallet
            </button>
          ) : !isFuji ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200">
                {shortenAddress(account)}
              </div>
              <button
                onClick={onSwitchNetwork}
                className="rounded-2xl border border-amber-300/30 bg-amber-400/10 px-5 py-2.5 text-sm font-medium text-amber-100 transition hover:bg-amber-400/20"
              >
                Switch to Fuji
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2.5 text-sm text-cyan-100">
              {shortenAddress(account)}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}