import type { EyeProfile } from "@/types/rework";

interface Props {
  users: EyeProfile[];
  activeUserId: string;
  onSelect: (id: string) => void;
}

function riskTone(user: EyeProfile) {
  if (user.riskTags.includes("retina-risk") || user.riskTags.includes("glaucoma-risk")) {
    return "text-amber-200";
  }
  if (user.riskTags.includes("dry-eye")) {
    return "text-cyan-100";
  }
  return "text-emerald-200";
}

export default function UserDatabasePanel({ users, activeUserId, onSelect }: Props) {
  return (
    <section className="rounded-[28px] border border-sky-300/15 bg-slate-950/45 p-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-sky-200/70">Free database / 免费数据库</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Seeded user library / 预置用户库</h2>
          <p className="mt-3 text-sm leading-7 text-sky-100/72">Uses localStorage + seeded demo records, so you can prototype without paying for a backend first.</p>
        </div>
        <div className="rounded-2xl border border-sky-300/10 bg-white/5 px-4 py-3 text-sm text-sky-50/80">
          {users.length} users loaded
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => {
          const active = user.id === activeUserId;
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelect(user.id)}
              className={`rounded-[24px] border p-5 text-left transition ${active ? "border-sky-300 bg-sky-400/15" : "border-sky-300/10 bg-white/5 hover:border-sky-300/30"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">{user.displayName}</p>
                  <p className="text-sm text-sky-100/70">{user.region} · {user.occupation}</p>
                </div>
                <span className={`text-sm ${riskTone(user)}`}>{user.iopRisk.toUpperCase()}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-sky-50/80">
                <div className="rounded-2xl bg-slate-950/35 p-3">
                  <p className="text-xs text-sky-100/50">Screen</p>
                  <p className="mt-1 font-medium">{user.screenHours} h</p>
                </div>
                <div className="rounded-2xl bg-slate-950/35 p-3">
                  <p className="text-xs text-sky-100/50">Dry eye</p>
                  <p className="mt-1 font-medium">{user.dryEyeLevel}/10</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {user.riskTags.map((tag) => (
                  <span key={tag} className="rounded-full border border-sky-300/10 bg-slate-950/35 px-3 py-1 text-xs text-sky-100/70">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
