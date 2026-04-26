import { Link } from "react-router-dom";

interface Props {
  account: string;
  isFuji: boolean;
}

export default function MainModuleGrid({ account, isFuji }: Props) {
  const modules = [
    {
      key: "m1",
      title: "M1 Contributor Flow",
      subtitle: "Register · Upload · Reward",
      status: account && isFuji ? "Ready" : "Connect wallet",
      href: "#m1-live",
    },
    {
      key: "m2",
      title: "M2 Cohort Licensing",
      subtitle: "Shared evidence · cohort sale",
      status: "Open page",
      href: "/m2",
    },
    {
      key: "m3",
      title: "M3 Recovery Missions",
      subtitle: "Sponsor · join · review",
      status: "Open page",
      href: "/m3",
    },
    {
      key: "rework",
      title: "Rework V2",
      subtitle: "Product shell · context layer",
      status: "Draft page",
      href: "/rework",
    },
  ];

  return (
    <section className="rounded-[32px] border border-cyan-300/15 bg-slate-950/55 p-5 shadow-[0_20px_70px_rgba(3,10,24,0.35)] backdrop-blur">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.35em] text-cyan-100/65">
          Modules
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          One project, four entry points
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) => {
          const body = (
            <div className="rounded-[26px] border border-cyan-300/15 bg-slate-900/65 p-5 transition hover:border-cyan-300/30 hover:bg-slate-900/80">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                    {module.key}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    {module.title}
                  </h3>
                </div>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                  {module.status}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                {module.subtitle}
              </p>
            </div>
          );

          return module.href.startsWith("#") ? (
            <a key={module.key} href={module.href}>
              {body}
            </a>
          ) : (
            <Link key={module.key} to={module.href}>
              {body}
            </Link>
          );
        })}
      </div>
    </section>
  );
}