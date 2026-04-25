import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  title: string;
  subtitle: string;
  actionSlot?: ReactNode;
  children: ReactNode;
}

export default function ReworkShell({ title, subtitle, actionSlot, children }: Props) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.28),_rgba(2,6,23,0.98)_42%,_#020617_80%)] text-slate-50">
      <header className="sticky top-0 z-40 border-b border-sky-400/20 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-2xl font-semibold tracking-wide text-sky-200">EyeChain</p>
            <p className="mt-1 text-sm text-sky-100/70">Dashboard / 仪表盘 · My Data / 我的数据 · Rewards / 奖励</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded-full border border-sky-300/20 bg-white/5 px-4 py-2 text-sm text-sky-100 transition hover:border-sky-300/40 hover:bg-white/10"
            >
              Back to Web3 flow / 返回链上流程
            </Link>
            {actionSlot}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[28px] border border-sky-300/15 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(3,105,161,0.22),rgba(191,219,254,0.14))] p-6 shadow-[0_20px_80px_rgba(14,165,233,0.12)] sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-sky-100/80">
                trusted bilingual intake / 双语可信采集
              </p>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-sky-50/78 sm:text-lg">
                {subtitle}
              </p>
            </div>
            <div className="rounded-[24px] border border-sky-200/10 bg-slate-950/40 p-5 text-sm leading-7 text-sky-50/75">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-200/70">Design direction / 设计方向</p>
              <p className="mt-3">
                From deep navy to open-sky blue, larger keywords, softer contrast, bilingual copy,
                and responsive cards for desktop, tablet, and mobile.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 space-y-8">{children}</div>
      </main>
    </div>
  );
}
