import type { IntakeDraft, VisionRiskTag } from "@/types/rework";

interface Props {
  draft: IntakeDraft;
  onChange: (next: IntakeDraft) => void;
}

const TAGS: { value: VisionRiskTag; label: string }[] = [
  { value: "dry-eye", label: "Dry eye / 干眼倾向" },
  { value: "high-myopia", label: "High myopia / 高度近视" },
  { value: "glaucoma-risk", label: "Glaucoma risk / 青光眼风险" },
  { value: "diabetes-risk", label: "Diabetes risk / 糖代谢风险" },
  { value: "post-op", label: "Post-op / 术后" },
  { value: "retina-risk", label: "Retina risk / 视网膜风险" },
];

export default function ConditionLifestyleStep({ draft, onChange }: Props) {
  const updateVision = (field: keyof IntakeDraft["vision"], value: string | VisionRiskTag[]) => {
    onChange({ ...draft, vision: { ...draft.vision, [field]: value } });
  };

  const updateLifestyle = (field: keyof IntakeDraft["lifestyle"], value: string) => {
    onChange({ ...draft, lifestyle: { ...draft.lifestyle, [field]: value } });
  };

  const toggleTag = (tag: VisionRiskTag) => {
    const nextTags = draft.vision.riskTags.includes(tag)
      ? draft.vision.riskTags.filter((item) => item !== tag)
      : [...draft.vision.riskTags, tag];
    updateVision("riskTags", nextTags);
  };

  return (
    <section className="rounded-[28px] border border-sky-300/15 bg-slate-950/45 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-lg font-semibold text-white">2</div>
        <div>
          <p className="text-xl font-semibold text-white">Vision condition & lifestyle / 视力与行为习惯</p>
          <p className="text-sm text-sky-100/70">Capture the variables that matter for threshold logic and future coaching.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-sky-100/75">Myopia diopters / 近视度数</span>
          <input value={draft.vision.myopiaDiopters} onChange={(e) => updateVision("myopiaDiopters", e.target.value)} className="w-full rounded-2xl border border-sky-300/15 bg-white/5 px-4 py-3 text-white" />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-sky-100/75">Exam frequency / 检查频率</span>
          <input value={draft.vision.examFrequency} onChange={(e) => updateVision("examFrequency", e.target.value)} className="w-full rounded-2xl border border-sky-300/15 bg-white/5 px-4 py-3 text-white" />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-sky-100/75">Surgery history / 手术史</span>
          <input value={draft.vision.surgeryHistory} onChange={(e) => updateVision("surgeryHistory", e.target.value)} className="w-full rounded-2xl border border-sky-300/15 bg-white/5 px-4 py-3 text-white" />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-sky-100/75">Dryness self-score / 干涩自评</span>
          <input value={draft.lifestyle.drynessLevel} onChange={(e) => updateLifestyle("drynessLevel", e.target.value)} className="w-full rounded-2xl border border-sky-300/15 bg-white/5 px-4 py-3 text-white" />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-sky-100/75">Daily screen time / 每日屏幕时长</span>
          <input value={draft.lifestyle.screenHours} onChange={(e) => updateLifestyle("screenHours", e.target.value)} className="w-full rounded-2xl border border-sky-300/15 bg-white/5 px-4 py-3 text-white" />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-sky-100/75">Sleep hours / 睡眠时长</span>
          <input value={draft.lifestyle.sleepHours} onChange={(e) => updateLifestyle("sleepHours", e.target.value)} className="w-full rounded-2xl border border-sky-300/15 bg-white/5 px-4 py-3 text-white" />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-sky-100/75">Outdoor hours / 户外时长</span>
          <input value={draft.lifestyle.outdoorHours} onChange={(e) => updateLifestyle("outdoorHours", e.target.value)} className="w-full rounded-2xl border border-sky-300/15 bg-white/5 px-4 py-3 text-white" />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-sky-100/75">Stress level / 压力水平</span>
          <input value={draft.lifestyle.stressLevel} onChange={(e) => updateLifestyle("stressLevel", e.target.value)} className="w-full rounded-2xl border border-sky-300/15 bg-white/5 px-4 py-3 text-white" />
        </label>
      </div>

      <div className="mt-5">
        <p className="mb-3 text-sm text-sky-100/75">Risk tags / 风险标签</p>
        <div className="flex flex-wrap gap-3">
          {TAGS.map((tag) => {
            const active = draft.vision.riskTags.includes(tag.value);
            return (
              <button
                key={tag.value}
                type="button"
                onClick={() => toggleTag(tag.value)}
                className={`rounded-full border px-4 py-2 text-sm transition ${active ? "border-sky-300 bg-sky-400/20 text-white" : "border-sky-300/15 bg-white/5 text-sky-100/75 hover:border-sky-300/40"}`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="mt-5 block space-y-2">
        <span className="text-sm text-sky-100/75">Diagnosis notes / 诊断备注</span>
        <textarea
          rows={4}
          value={draft.vision.diagnosisNotes}
          onChange={(e) => updateVision("diagnosisNotes", e.target.value)}
          className="w-full rounded-2xl border border-sky-300/15 bg-white/5 px-4 py-3 text-white"
          placeholder="OCT stable, occasional dryness, high-myopia check every 6 months..."
        />
      </label>
    </section>
  );
}
