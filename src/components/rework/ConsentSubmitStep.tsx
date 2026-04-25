import type { IntakeDraft } from "@/types/rework";

interface Props {
  draft: IntakeDraft;
  onChange: (next: IntakeDraft) => void;
  onSubmit: () => void;
}

const AGREEMENTS = [
  { id: "encrypt-storage", label: "Data is encrypted and stored securely / 数据加密存储" },
  { id: "onchain-proof", label: "A cryptographic proof may be recorded on-chain / 可记录链上证明" },
  { id: "change-permissions", label: "I can revoke or change sharing permissions anytime / 我可随时更改授权" },
  { id: "reward-eligible", label: "I understand reward eligibility depends on review logic / 我理解奖励需经审核逻辑" },
  { id: "research-use", label: "I understand data may support trusted research / 我理解数据可用于可信研究" },
];

export default function ConsentSubmitStep({ draft, onChange, onSubmit }: Props) {
  const toggleAgreement = (id: string) => {
    const agreedItems = draft.consent.agreedItems.includes(id)
      ? draft.consent.agreedItems.filter((item) => item !== id)
      : [...draft.consent.agreedItems, id];

    onChange({ ...draft, consent: { ...draft.consent, agreedItems } });
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[28px] border border-sky-300/15 bg-slate-950/45 p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-lg font-semibold text-white">4</div>
          <div>
            <p className="text-xl font-semibold text-white">Consent, uploads & submit / 授权、上传与提交</p>
            <p className="text-sm text-sky-100/70">Final review step that feels calm, safe, and legible.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["private", "Private / 完全私密"],
            ["open", "Open / 默认共享"],
            ["negotiable", "Negotiable / 每次询问"],
          ].map(([value, label]) => {
            const active = draft.consent.privacyMode === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange({ ...draft, consent: { ...draft.consent, privacyMode: value as IntakeDraft["consent"]["privacyMode"] } })}
                className={`rounded-[24px] border p-4 text-left transition ${active ? "border-sky-300 bg-sky-400/20" : "border-sky-300/15 bg-white/5"}`}
              >
                <p className="font-medium text-white">{label}</p>
              </button>
            );
          })}
        </div>

        <label className="mt-5 block space-y-2">
          <span className="text-sm text-sky-100/75">Upload summary / 上传摘要</span>
          <textarea
            rows={4}
            value={draft.consent.uploadSummary}
            onChange={(e) => onChange({ ...draft, consent: { ...draft.consent, uploadSummary: e.target.value } })}
            className="w-full rounded-2xl border border-sky-300/15 bg-white/5 px-4 py-3 text-white"
          />
        </label>

        <div className="mt-5 rounded-[24px] border border-sky-300/10 bg-white/5 p-4">
          <p className="text-sm font-medium text-white">Consent checklist / 授权清单</p>
          <div className="mt-3 space-y-3">
            {AGREEMENTS.map((item) => (
              <label key={item.id} className="flex items-start gap-3 text-sm text-sky-100/82">
                <input
                  type="checkbox"
                  checked={draft.consent.agreedItems.includes(item.id)}
                  onChange={() => toggleAgreement(item.id)}
                  className="mt-1 h-4 w-4 rounded"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <aside className="rounded-[28px] border border-sky-300/15 bg-[linear-gradient(180deg,rgba(59,130,246,0.15),rgba(15,23,42,0.62))] p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-sky-200/70">Submission summary / 提交摘要</p>
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-sky-300/10 bg-white/5 p-4 text-sm text-sky-50/80">
            <p className="font-medium text-white">Selected privacy / 授权模式</p>
            <p className="mt-2 capitalize">{draft.consent.privacyMode}</p>
          </div>
          <div className="rounded-2xl border border-sky-300/10 bg-white/5 p-4 text-sm text-sky-50/80">
            <p className="font-medium text-white">Connected device count / 已连接设备数</p>
            <p className="mt-2">{draft.wearables.connectedDeviceIds.length}</p>
          </div>
          <div className="rounded-2xl border border-sky-300/10 bg-white/5 p-4 text-sm text-sky-50/80">
            <p className="font-medium text-white">Agreed items / 已同意条目</p>
            <p className="mt-2">{draft.consent.agreedItems.length} / {AGREEMENTS.length}</p>
          </div>
          <button
            onClick={onSubmit}
            className="w-full rounded-full bg-sky-500 px-5 py-3 text-base font-semibold text-white transition hover:bg-sky-400"
          >
            Save profile to free database / 保存到免费数据库
          </button>
        </div>
      </aside>
    </section>
  );
}
