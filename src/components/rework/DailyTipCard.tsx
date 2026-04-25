import type { DailyTip } from "@/types/rework";

interface Props {
  tip: DailyTip;
  open: boolean;
  onClose: () => void;
}

const categoryLabel: Record<DailyTip["category"], string> = {
  screen: "Screen / 屏幕",
  "dry-eye": "Dry eye / 干眼",
  environment: "Environment / 环境",
  metabolic: "Metabolic / 代谢",
  exercise: "Exercise / 运动",
  urgent: "Urgent / 急症",
};

export default function DailyTipCard({ tip, open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[28px] border border-sky-300/20 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(3,37,65,0.98))] p-6 shadow-2xl shadow-sky-950/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-200/70">Today&apos;s free tip / 今日免费提醒</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">{tip.title}</h3>
            <p className="mt-1 text-lg text-sky-100/80">{tip.titleZh}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-sky-300/20 px-3 py-1 text-sm text-sky-100/80 transition hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-sky-300/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-200/65">{categoryLabel[tip.category]}</p>
          <p className="mt-3 text-base leading-7 text-slate-100">{tip.body}</p>
          <p className="mt-3 text-base leading-7 text-sky-100/85">{tip.bodyZh}</p>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-sky-100/65">Tip rotates daily and is stored locally for free. / 每日轮换提示，使用本地免费存储。</p>
          <button
            onClick={onClose}
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400"
          >
            Got it / 知道了
          </button>
        </div>
      </div>
    </div>
  );
}
