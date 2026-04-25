import { THRESHOLD_RULES } from "@/data/dailyTips";
import type { EyeProfile, ThresholdRule } from "@/types/rework";

interface Props {
  profile: EyeProfile;
}

function getMetricValue(profile: EyeProfile, metric: string): number {
  const source = profile as unknown as Record<string, number | string>;
  return Number(source[metric] ?? 0);
}

function evaluateRule(profile: EyeProfile, rule: ThresholdRule) {
  const actual = getMetricValue(profile, rule.metric);
  if (rule.direction === "max") {
    return { actual, pass: actual <= rule.value };
  }
  if (rule.direction === "min") {
    return { actual, pass: actual >= rule.value };
  }
  const range = rule.range ?? [0, 0];
  return { actual, pass: actual >= range[0] && actual <= range[1] };
}

const severityStyle: Record<ThresholdRule["severity"], string> = {
  normal: "border-emerald-300/20 bg-emerald-400/10 text-emerald-200",
  attention: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
  warning: "border-amber-300/20 bg-amber-400/10 text-amber-100",
  critical: "border-rose-300/20 bg-rose-400/10 text-rose-100",
};

export default function SystemThresholdMap({ profile }: Props) {
  return (
    <section className="rounded-[28px] border border-sky-300/15 bg-slate-950/45 p-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-sky-200/70">System map & threshold logic / 原理图与阈值逻辑</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Reliable threshold view / 可靠阈值视图</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-sky-100/72">
            From user inputs to wearable sync, risk thresholds, free database storage, and future on-chain proofs.
          </p>
        </div>
        <div className="rounded-2xl border border-sky-300/10 bg-white/5 px-4 py-3 text-sm text-sky-50/80">
          Active profile: {profile.displayName}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {[
          ["1", "Input", "用户输入"],
          ["2", "Wearables", "设备连接"],
          ["3", "Thresholds", "阈值判断"],
          ["4", "Free DB", "免费数据库"],
          ["5", "Rewards + Proof", "奖励与证明"],
        ].map(([index, label, labelZh]) => (
          <div key={index} className="rounded-[24px] border border-sky-300/10 bg-[linear-gradient(180deg,rgba(59,130,246,0.1),rgba(15,23,42,0.55))] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-sky-200/70">{index}</p>
            <p className="mt-3 text-lg font-semibold text-white">{label}</p>
            <p className="text-sm text-sky-100/70">{labelZh}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {THRESHOLD_RULES.map((rule) => {
          const result = evaluateRule(profile, rule);
          return (
            <div key={rule.id} className={`rounded-[24px] border p-4 ${severityStyle[rule.severity]}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{rule.label}</p>
                  <p className="text-xs opacity-80">{rule.labelZh}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${result.pass ? "bg-emerald-500/20 text-emerald-100" : "bg-rose-500/20 text-rose-100"}`}>
                  {result.pass ? "ok" : "flag"}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-slate-950/30 p-3">
                  <p className="text-xs opacity-70">Actual / 当前</p>
                  <p className="mt-1 text-lg font-semibold">{result.actual}</p>
                </div>
                <div className="rounded-2xl bg-slate-950/30 p-3">
                  <p className="text-xs opacity-70">Threshold / 阈值</p>
                  <p className="mt-1 text-lg font-semibold">{rule.value} {rule.unit}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 opacity-90">{rule.rationale}</p>
              <p className="mt-2 text-sm leading-6 opacity-85">{rule.rationaleZh}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
