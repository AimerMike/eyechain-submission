import type { IntakeDraft } from "@/types/rework";

interface Props {
  draft: IntakeDraft;
  onChange: (next: IntakeDraft) => void;
}

const AGE_OPTIONS = ["18-24", "25-34", "35-44", "45-54", "55+"];

export default function ProfileIntakeStep({ draft, onChange }: Props) {
  const update = (field: keyof IntakeDraft["basics"], value: string) => {
    onChange({
      ...draft,
      basics: {
        ...draft.basics,
        [field]: value,
      },
    });
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="rounded-[28px] border border-sky-300/15 bg-slate-950/45 p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-lg font-semibold text-white">1</div>
          <div>
            <p className="text-xl font-semibold text-white">Profile basics / 基础信息</p>
            <p className="text-sm text-sky-100/70">Tell us who you are and how you want to be contacted.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm text-sky-100/75">Full name / 姓名</span>
            <input
              value={draft.basics.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="Lin / 林"
              className="w-full rounded-2xl border border-sky-300/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-sky-100/30"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-sky-100/75">Age range / 年龄段</span>
            <select
              value={draft.basics.ageRange}
              onChange={(e) => update("ageRange", e.target.value)}
              className="w-full rounded-2xl border border-sky-300/15 bg-white/5 px-4 py-3 text-white outline-none"
            >
              {AGE_OPTIONS.map((item) => (
                <option key={item} value={item} className="bg-slate-900">
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-sky-100/75">Region / 所在地区</span>
            <input
              value={draft.basics.region}
              onChange={(e) => update("region", e.target.value)}
              className="w-full rounded-2xl border border-sky-300/15 bg-white/5 px-4 py-3 text-white outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-sky-100/75">Preferred language / 语言</span>
            <select
              value={draft.basics.language}
              onChange={(e) => update("language", e.target.value)}
              className="w-full rounded-2xl border border-sky-300/15 bg-white/5 px-4 py-3 text-white outline-none"
            >
              <option value="bilingual" className="bg-slate-900">English + 中文</option>
              <option value="en" className="bg-slate-900">English</option>
              <option value="zh" className="bg-slate-900">中文</option>
            </select>
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-sky-100/75">Contact preference / 联系方式偏好</span>
            <input
              value={draft.basics.contactPreference}
              onChange={(e) => update("contactPreference", e.target.value)}
              className="w-full rounded-2xl border border-sky-300/15 bg-white/5 px-4 py-3 text-white outline-none"
            />
          </label>
        </div>
      </div>

      <aside className="rounded-[28px] border border-sky-300/15 bg-[linear-gradient(180deg,rgba(59,130,246,0.16),rgba(15,23,42,0.6))] p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-sky-200/70">Reliable onboarding / 可信采集</p>
        <h3 className="mt-3 text-2xl font-semibold text-white">Your data, your control / 你的数据，你做主</h3>
        <ul className="mt-5 space-y-3 text-sm leading-7 text-sky-50/80">
          <li>• Bilingual form labels reduce confusion for mixed-language users.</li>
          <li>• Soft contrast and larger headings improve readability.</li>
          <li>• This step is tablet and phone friendly out of the box.</li>
        </ul>
      </aside>
    </section>
  );
}
