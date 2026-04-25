import { AVAILABLE_DEVICES } from "@/data/reworkUsers";
import type { DeviceConnectionState, IntakeDraft } from "@/types/rework";

interface Props {
  draft: IntakeDraft;
  onChange: (next: IntakeDraft) => void;
}

const PERMISSION_OPTIONS = [
  { key: "sleep", label: "Sleep / 睡眠" },
  { key: "activity", label: "Activity / 活动" },
  { key: "heartRate", label: "Heart rate / 心率" },
  { key: "ambientLight", label: "Ambient light / 环境光" },
  { key: "blinkRate", label: "Blink rate / 眨眼频率" },
  { key: "screenDistance", label: "Screen distance / 屏距" },
];

const stateLabel: Record<DeviceConnectionState, string> = {
  connected: "Connected / 已连接",
  syncing: "Syncing / 同步中",
  available: "Available / 可连接",
  disconnected: "Disconnected / 未连接",
};

export default function WearablesConnectStep({ draft, onChange }: Props) {
  const toggleDevice = (id: string) => {
    const nextIds = draft.wearables.connectedDeviceIds.includes(id)
      ? draft.wearables.connectedDeviceIds.filter((item) => item !== id)
      : [...draft.wearables.connectedDeviceIds, id];

    onChange({
      ...draft,
      wearables: {
        ...draft.wearables,
        connectedDeviceIds: nextIds,
      },
    });
  };

  const togglePermission = (key: string) => {
    const nextPermissions = draft.wearables.permissionKeys.includes(key)
      ? draft.wearables.permissionKeys.filter((item) => item !== key)
      : [...draft.wearables.permissionKeys, key];

    onChange({
      ...draft,
      wearables: {
        ...draft.wearables,
        permissionKeys: nextPermissions,
      },
    });
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <div className="rounded-[28px] border border-sky-300/15 bg-slate-950/45 p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-lg font-semibold text-white">3</div>
          <div>
            <p className="text-xl font-semibold text-white">Wearables API connection / 穿戴设备连接</p>
            <p className="text-sm text-sky-100/70">A virtual hardware view for smartwatch, smart band, health platforms, and vision sensors.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {AVAILABLE_DEVICES.map((device) => {
            const selected = draft.wearables.connectedDeviceIds.includes(device.id);
            return (
              <button
                key={device.id}
                type="button"
                onClick={() => toggleDevice(device.id)}
                className={`rounded-[24px] border p-4 text-left transition ${selected ? "border-sky-300 bg-sky-400/18" : "border-sky-300/15 bg-white/5 hover:border-sky-300/35"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-medium text-white">{device.name}</p>
                    <p className="text-sm text-sky-100/65">{device.nameZh}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-slate-950/60 px-2 py-1 text-[11px] text-sky-100/75">{device.brand}</span>
                </div>
                <p className="mt-4 text-sm text-sky-100/75">{stateLabel[device.state]}</p>
                <p className="mt-2 text-xs leading-6 text-sky-100/55">Metrics: {device.metricKeys.join(", ")}</p>
                {device.lastSyncMinutesAgo !== undefined && (
                  <p className="mt-2 text-xs text-sky-200/60">Last sync: {device.lastSyncMinutesAgo} min ago</p>
                )}
                {device.batteryPct !== undefined && (
                  <p className="mt-1 text-xs text-sky-200/60">Battery: {device.batteryPct}%</p>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-[24px] border border-sky-300/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white">API permissions / API 授权项</p>
              <p className="text-sm text-sky-100/65">Toggle which signals the user agrees to share.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-sky-100/80">
              <input
                type="checkbox"
                checked={draft.wearables.syncEnabled}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    wearables: { ...draft.wearables, syncEnabled: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded"
              />
              Background sync / 后台同步
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {PERMISSION_OPTIONS.map((item) => {
              const active = draft.wearables.permissionKeys.includes(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => togglePermission(item.key)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${active ? "border-sky-300 bg-sky-400/18 text-white" : "border-sky-300/15 bg-slate-950/30 text-sky-100/70"}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="rounded-[28px] border border-sky-300/15 bg-[linear-gradient(180deg,rgba(59,130,246,0.15),rgba(15,23,42,0.62))] p-6">
        <p className="text-xs uppercase tracking-[0.22em] text-sky-200/70">Trust layer / 可信层</p>
        <div className="mt-4 space-y-4 text-sm leading-7 text-sky-50/80">
          <div className="rounded-2xl border border-sky-300/10 bg-white/5 p-4">
            <p className="font-medium text-white">Encrypted sync / 加密同步</p>
            <p className="mt-2">Virtual device cards make the hardware story visible even before real APIs are wired.</p>
          </div>
          <div className="rounded-2xl border border-sky-300/10 bg-white/5 p-4">
            <p className="font-medium text-white">Scalable later / 后续可扩展</p>
            <p className="mt-2">When you connect real Apple Health, Google Fit, or custom Bluetooth APIs later, this UX can stay mostly unchanged.</p>
          </div>
        </div>
      </aside>
    </section>
  );
}
