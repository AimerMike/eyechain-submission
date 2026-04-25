import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type PrivacyMode = "private" | "open" | "negotiable";
type DeviceStatus = "connected" | "available" | "offline";

type UserRecord = {
  id: string;
  createdAt: string;
  profile: {
    nickname: string;
    ageRange: string;
    gender: string;
    city: string;
    occupation: string;
    diagnosis: string;
    myopiaStage: string;
    leftVision: string;
    rightVision: string;
    leftAxialLength: string;
    rightAxialLength: string;
    baselineRisk: string;
    symptoms: string[];
    treatmentHistory: string;
    goals: string;
  };
  lifestyle: {
    screenHours: string;
    outdoorHours: string;
    sleepHours: string;
    exerciseLevel: string;
    nearWorkIntensity: string;
    postureHabit: string;
    symptomTrend: string;
    notes: string;
  };
  devices: {
    band: DeviceStatus;
    watch: DeviceStatus;
    glasses: DeviceStatus;
    healthApi: DeviceStatus;
    consent: {
      blink: boolean;
      sleep: boolean;
      activity: boolean;
      lightExposure: boolean;
      screenDistance: boolean;
      posture: boolean;
    };
  };
  privacyMode: PrivacyMode;
};

const STORAGE_KEY = "eyechain_rework_users_v1";
const TIP_DATE_KEY = "eyechain_daily_tip_date_v1";
const TIP_INDEX_KEY = "eyechain_daily_tip_index_v1";

const dailyTips = [
  {
    title: "Reduce retinal traction risk",
    zh: "减少视网膜牵拉风险",
    body: "Avoid sudden high-impact jumping or head-shaking when you already feel flashes, floaters, or postoperative discomfort.",
  },
  {
    title: "Use symptom logging as evidence",
    zh: "把症状记录当作证据",
    body: "Record when floaters, flashes, pain, blur, or shadow appear. A stable timestamped pattern is more useful than vague memory.",
  },
  {
    title: "Screen posture matters",
    zh: "看屏姿势很重要",
    body: "Long near-work with poor posture can worsen strain and symptoms. Take breaks, raise screen height, and keep distance consistent.",
  },
  {
    title: "Outdoor light is protective",
    zh: "户外光照具有保护意义",
    body: "Structured daylight exposure is helpful for many high-myopia users. Consistency matters more than one intense session.",
  },
  {
    title: "Share selectively",
    zh: "选择性共享",
    body: "Patient-owned data does not mean everything must be public. Good systems let you keep private, open, or negotiable modes.",
  },
];

const seededUsers: UserRecord[] = [
  {
    id: "demo-001",
    createdAt: "2026-04-16",
    profile: {
      nickname: "Demo High-Myopia User",
      ageRange: "25-34",
      gender: "Female",
      city: "Shenzhen",
      occupation: "Engineer",
      diagnosis: "High myopia with retinal risk concern",
      myopiaStage: "Pathologic risk watch",
      leftVision: "-11.50",
      rightVision: "-10.75",
      leftAxialLength: "28.6",
      rightAxialLength: "28.1",
      baselineRisk: "Medium-High",
      symptoms: ["Floaters", "Eye strain"],
      treatmentHistory: "Laser observation, regular fundoscopy",
      goals: "Safer exercise guidance, symptom tracking, patient-owned data record",
    },
    lifestyle: {
      screenHours: "9",
      outdoorHours: "1",
      sleepHours: "6",
      exerciseLevel: "Light",
      nearWorkIntensity: "High",
      postureHabit: "Needs improvement",
      symptomTrend: "Stable with occasional strain",
      notes: "Wants preventive guidance and better evidence record structure.",
    },
    devices: {
      band: "connected",
      watch: "available",
      glasses: "offline",
      healthApi: "connected",
      consent: {
        blink: true,
        sleep: true,
        activity: true,
        lightExposure: true,
        screenDistance: false,
        posture: true,
      },
    },
    privacyMode: "negotiable",
  },
  {
    id: "demo-002",
    createdAt: "2026-04-17",
    profile: {
      nickname: "Post-op Recovery User",
      ageRange: "35-44",
      gender: "Male",
      city: "Hong Kong",
      occupation: "Designer",
      diagnosis: "Retinal surgery recovery follow-up",
      myopiaStage: "Post-op",
      leftVision: "-8.00",
      rightVision: "-9.25",
      leftAxialLength: "27.2",
      rightAxialLength: "27.9",
      baselineRisk: "High",
      symptoms: ["Dryness", "Light sensitivity"],
      treatmentHistory: "Post-op follow-up and imaging",
      goals: "Recovery mission compliance and safe data monetization",
    },
    lifestyle: {
      screenHours: "7",
      outdoorHours: "0.5",
      sleepHours: "7",
      exerciseLevel: "Recovery only",
      nearWorkIntensity: "Medium",
      postureHabit: "Careful",
      symptomTrend: "Improving",
      notes: "Needs milestone-based recovery tracking.",
    },
    devices: {
      band: "available",
      watch: "connected",
      glasses: "available",
      healthApi: "connected",
      consent: {
        blink: true,
        sleep: true,
        activity: true,
        lightExposure: false,
        screenDistance: true,
        posture: true,
      },
    },
    privacyMode: "private",
  },
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadUsers(): UserRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seededUsers));
      return seededUsers;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seededUsers;
  } catch {
    return seededUsers;
  }
}

function saveUsers(users: UserRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function statusPill(status: DeviceStatus) {
  if (status === "connected") return "Connected 已连接";
  if (status === "available") return "Available 可接入";
  return "Offline 离线";
}

function riskColor(risk: string) {
  if (risk.toLowerCase().includes("high")) return "text-red-300 border-red-400/40 bg-red-500/10";
  if (risk.toLowerCase().includes("medium")) return "text-amber-200 border-amber-400/40 bg-amber-500/10";
  return "text-sky-200 border-sky-400/40 bg-sky-500/10";
}

export default function Rework() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"profile" | "lifestyle" | "devices" | "map">("profile");
  const [showTip, setShowTip] = useState(true);

  const [profile, setProfile] = useState<UserRecord["profile"]>({
    nickname: "",
    ageRange: "",
    gender: "",
    city: "",
    occupation: "",
    diagnosis: "",
    myopiaStage: "",
    leftVision: "",
    rightVision: "",
    leftAxialLength: "",
    rightAxialLength: "",
    baselineRisk: "Medium",
    symptoms: [],
    treatmentHistory: "",
    goals: "",
  });

  const [lifestyle, setLifestyle] = useState<UserRecord["lifestyle"]>({
    screenHours: "",
    outdoorHours: "",
    sleepHours: "",
    exerciseLevel: "",
    nearWorkIntensity: "",
    postureHabit: "",
    symptomTrend: "",
    notes: "",
  });

  const [devices, setDevices] = useState<UserRecord["devices"]>({
    band: "available",
    watch: "available",
    glasses: "offline",
    healthApi: "available",
    consent: {
      blink: true,
      sleep: true,
      activity: true,
      lightExposure: false,
      screenDistance: false,
      posture: true,
    },
  });

  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>("negotiable");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const data = loadUsers();
    setUsers(data);

    const today = getTodayKey();
    const savedDate = localStorage.getItem(TIP_DATE_KEY);
    const savedIndex = Number(localStorage.getItem(TIP_INDEX_KEY) || "0");

    if (savedDate !== today) {
      const nextIndex = (savedIndex + 1) % dailyTips.length;
      localStorage.setItem(TIP_DATE_KEY, today);
      localStorage.setItem(TIP_INDEX_KEY, String(nextIndex));
      setShowTip(true);
    } else {
      setShowTip(true);
    }
  }, []);

  const dailyTip = useMemo(() => {
    const idx = Number(localStorage.getItem(TIP_INDEX_KEY) || "0") % dailyTips.length;
    return dailyTips[idx];
  }, [users.length]);

  const completion = useMemo(() => {
    const checks = [
      profile.nickname,
      profile.ageRange,
      profile.city,
      profile.diagnosis,
      profile.leftVision,
      profile.rightVision,
      lifestyle.screenHours,
      lifestyle.sleepHours,
      lifestyle.symptomTrend,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [profile, lifestyle]);

  const saveCurrentUser = () => {
    const newUser: UserRecord = {
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      profile,
      lifestyle,
      devices,
      privacyMode,
    };
    const next = [newUser, ...users];
    setUsers(next);
    saveUsers(next);
    setSaveMessage("Saved locally / 已保存到本地免费数据库");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-sky-950 to-sky-400/30">
        <nav className="sticky top-0 z-50 border-b border-sky-400/20 bg-slate-950/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
            <div>
              <div className="text-3xl font-semibold tracking-wide text-sky-50 md:text-4xl">
                eyeChain
              </div>
              <div className="mt-1 text-sm tracking-[0.25em] text-sky-200/80">
                Rework · Human Data / Device / Trust Layer
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/"
                className="rounded-full border border-sky-300/30 bg-sky-400/10 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-400/20"
              >
                Back 返回主页
              </Link>
              <span className="rounded-full border border-sky-300/30 bg-slate-900/60 px-4 py-2 text-sm text-sky-100">
                Web / Tablet / Mobile responsive target
              </span>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
          {showTip && (
            <section className="mb-6 rounded-3xl border border-sky-200/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.35em] text-sky-200/80">
                    Daily Tip 每日提示
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white">
                    {dailyTip.title}
                  </div>
                  <div className="mt-1 text-lg text-sky-100/90">{dailyTip.zh}</div>
                  <div className="mt-3 max-w-4xl text-sm leading-7 text-sky-50/85">
                    {dailyTip.body}
                  </div>
                </div>
                <button
                  onClick={() => setShowTip(false)}
                  className="rounded-full border border-sky-200/30 bg-slate-900/50 px-4 py-2 text-sm text-sky-100 hover:bg-slate-800/70"
                >
                  Close 关闭
                </button>
              </div>
            </section>
          )}

          <section className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
            <div className="rounded-[28px] border border-sky-200/15 bg-slate-950/55 p-5 shadow-2xl backdrop-blur-xl md:p-6">
              <div className="flex flex-wrap gap-2">
                {[
                  ["profile", "01 Personal Profile 个人基线"],
                  ["lifestyle", "02 History & Lifestyle 病史与行为"],
                  ["devices", "03 Wearables & API 穿戴与接口"],
                  ["map", "04 System Map 关系图阈值"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      activeTab === key
                        ? "bg-sky-300 text-slate-950"
                        : "border border-sky-200/20 bg-white/5 text-sky-100 hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === "profile" && (
                <div className="mt-6 space-y-6">
                  <div>
                    <h1 className="text-3xl font-semibold text-white md:text-4xl">
                      Personal Profile & Vision Baseline
                    </h1>
                    <p className="mt-2 text-base leading-7 text-sky-100/80">
                      给用户一打开就有“这是认真做医疗与数据治理产品”的感觉：柔和、可靠、英中双语、信息完整。
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      ["Nickname 昵称", profile.nickname, (v: string) => setProfile({ ...profile, nickname: v })],
                      ["Age Range 年龄段", profile.ageRange, (v: string) => setProfile({ ...profile, ageRange: v })],
                      ["Gender 性别", profile.gender, (v: string) => setProfile({ ...profile, gender: v })],
                      ["City 城市", profile.city, (v: string) => setProfile({ ...profile, city: v })],
                      ["Occupation 职业", profile.occupation, (v: string) => setProfile({ ...profile, occupation: v })],
                      ["Diagnosis 诊断概况", profile.diagnosis, (v: string) => setProfile({ ...profile, diagnosis: v })],
                      ["Myopia Stage 近视阶段", profile.myopiaStage, (v: string) => setProfile({ ...profile, myopiaStage: v })],
                      ["Baseline Risk 基线风险", profile.baselineRisk, (v: string) => setProfile({ ...profile, baselineRisk: v })],
                      ["Left Vision 左眼屈光", profile.leftVision, (v: string) => setProfile({ ...profile, leftVision: v })],
                      ["Right Vision 右眼屈光", profile.rightVision, (v: string) => setProfile({ ...profile, rightVision: v })],
                      ["Left Axial Length 左眼眼轴", profile.leftAxialLength, (v: string) => setProfile({ ...profile, leftAxialLength: v })],
                      ["Right Axial Length 右眼眼轴", profile.rightAxialLength, (v: string) => setProfile({ ...profile, rightAxialLength: v })],
                    ].map(([label, value, onChange]) => (
                      <label key={label} className="block">
                        <div className="mb-2 text-sm font-medium text-sky-100">{label}</div>
                        <input
                          value={value as string}
                          onChange={(e) => (onChange as any)(e.target.value)}
                          className="w-full rounded-2xl border border-sky-200/15 bg-slate-900/70 px-4 py-3 text-sky-50 outline-none ring-0 placeholder:text-sky-200/30"
                        />
                      </label>
                    ))}
                  </div>

                  <label className="block">
                    <div className="mb-2 text-sm font-medium text-sky-100">
                      Treatment History 治疗史
                    </div>
                    <textarea
                      value={profile.treatmentHistory}
                      onChange={(e) =>
                        setProfile({ ...profile, treatmentHistory: e.target.value })
                      }
                      rows={3}
                      className="w-full rounded-2xl border border-sky-200/15 bg-slate-900/70 px-4 py-3 text-sky-50"
                    />
                  </label>

                  <label className="block">
                    <div className="mb-2 text-sm font-medium text-sky-100">
                      Goals 目标
                    </div>
                    <textarea
                      value={profile.goals}
                      onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
                      rows={3}
                      className="w-full rounded-2xl border border-sky-200/15 bg-slate-900/70 px-4 py-3 text-sky-50"
                    />
                  </label>
                </div>
              )}

              {activeTab === "lifestyle" && (
                <div className="mt-6 space-y-6">
                  <div>
                    <h1 className="text-3xl font-semibold text-white md:text-4xl">
                      Eye Health History & Lifestyle Risks
                    </h1>
                    <p className="mt-2 text-base leading-7 text-sky-100/80">
                      这一页补回原来“用户细节”维度，不再只有智能合约关系。
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      ["Daily Screen Hours 每日屏幕时长", lifestyle.screenHours, (v: string) => setLifestyle({ ...lifestyle, screenHours: v })],
                      ["Outdoor Hours 户外时长", lifestyle.outdoorHours, (v: string) => setLifestyle({ ...lifestyle, outdoorHours: v })],
                      ["Sleep Hours 睡眠时长", lifestyle.sleepHours, (v: string) => setLifestyle({ ...lifestyle, sleepHours: v })],
                      ["Exercise Level 运动水平", lifestyle.exerciseLevel, (v: string) => setLifestyle({ ...lifestyle, exerciseLevel: v })],
                      ["Near Work Intensity 近距离用眼强度", lifestyle.nearWorkIntensity, (v: string) => setLifestyle({ ...lifestyle, nearWorkIntensity: v })],
                      ["Posture Habit 姿势习惯", lifestyle.postureHabit, (v: string) => setLifestyle({ ...lifestyle, postureHabit: v })],
                      ["Symptom Trend 症状趋势", lifestyle.symptomTrend, (v: string) => setLifestyle({ ...lifestyle, symptomTrend: v })],
                    ].map(([label, value, onChange]) => (
                      <label key={label} className="block">
                        <div className="mb-2 text-sm font-medium text-sky-100">{label}</div>
                        <input
                          value={value as string}
                          onChange={(e) => (onChange as any)(e.target.value)}
                          className="w-full rounded-2xl border border-sky-200/15 bg-slate-900/70 px-4 py-3 text-sky-50"
                        />
                      </label>
                    ))}
                  </div>

                  <label className="block">
                    <div className="mb-2 text-sm font-medium text-sky-100">
                      Notes 备注
                    </div>
                    <textarea
                      value={lifestyle.notes}
                      onChange={(e) => setLifestyle({ ...lifestyle, notes: e.target.value })}
                      rows={5}
                      className="w-full rounded-2xl border border-sky-200/15 bg-slate-900/70 px-4 py-3 text-sky-50"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className={`rounded-3xl border p-5 ${riskColor(profile.baselineRisk)}`}>
                      <div className="text-xs uppercase tracking-[0.3em]">Baseline Risk</div>
                      <div className="mt-3 text-2xl font-semibold">{profile.baselineRisk || "Medium"}</div>
                      <div className="mt-2 text-sm leading-6 text-sky-50/80">
                        综合病史、近距离负荷、症状趋势、睡眠与行为模式做可靠感展示。
                      </div>
                    </div>
                    <div className="rounded-3xl border border-sky-200/15 bg-white/5 p-5">
                      <div className="text-xs uppercase tracking-[0.3em] text-sky-200/80">
                        Threshold Hint
                      </div>
                      <div className="mt-3 text-lg font-semibold text-white">
                        Screen ≥ 8h + sleep &lt; 6.5h
                      </div>
                      <div className="mt-2 text-sm leading-6 text-sky-100/75">
                        Push gentle caution / 温和提醒
                      </div>
                    </div>
                    <div className="rounded-3xl border border-sky-200/15 bg-white/5 p-5">
                      <div className="text-xs uppercase tracking-[0.3em] text-sky-200/80">
                        Reliability Layer
                      </div>
                      <div className="mt-3 text-lg font-semibold text-white">
                        Patient-owned + traceable
                      </div>
                      <div className="mt-2 text-sm leading-6 text-sky-100/75">
                        输入页先建立信任，再引导链上流程。
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "devices" && (
                <div className="mt-6 space-y-6">
                  <div>
                    <h1 className="text-3xl font-semibold text-white md:text-4xl">
                      Wearables, Device API & Permissions
                    </h1>
                    <p className="mt-2 text-base leading-7 text-sky-100/80">
                      虚拟展示手环、手表、眼镜、健康 API 的连接状态，让人知道这产品未来不是纯表单，而是可接硬件数据。
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["Smart Band 智能手环", devices.band, "Heart rate / sleep / activity"],
                      ["Smart Watch 智能手表", devices.watch, "Movement / stress / reminder"],
                      ["Smart Glasses 智能眼镜", devices.glasses, "Distance / blink / light"],
                      ["Health API 健康接口", devices.healthApi, "Unified sync / encrypted"],
                    ].map(([title, status, desc], idx) => (
                      <div
                        key={title}
                        className="rounded-3xl border border-sky-200/15 bg-white/5 p-5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-lg font-semibold text-white">{title}</div>
                          <button
                            onClick={() => {
                              const key = ["band", "watch", "glasses", "healthApi"][idx] as keyof UserRecord["devices"];
                              const current = devices[key] as DeviceStatus;
                              const next: DeviceStatus =
                                current === "offline"
                                  ? "available"
                                  : current === "available"
                                  ? "connected"
                                  : "offline";
                              setDevices({ ...devices, [key]: next });
                            }}
                            className="rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1 text-xs text-sky-100"
                          >
                            Toggle
                          </button>
                        </div>
                        <div className="mt-4 text-sm text-sky-200/80">{desc}</div>
                        <div className="mt-5 rounded-2xl border border-sky-200/15 bg-slate-900/70 p-4 text-sm text-white">
                          {statusPill(status as DeviceStatus)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-3xl border border-sky-200/15 bg-white/5 p-5">
                    <div className="text-xl font-semibold text-white">
                      Data Permission Matrix 数据授权矩阵
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {[
                        ["Blink Frequency 眨眼频率", "blink"],
                        ["Sleep 睡眠", "sleep"],
                        ["Activity 活动", "activity"],
                        ["Light Exposure 光照", "lightExposure"],
                        ["Screen Distance 看屏距离", "screenDistance"],
                        ["Posture 姿势", "posture"],
                      ].map(([label, key]) => (
                        <label
                          key={key}
                          className="flex items-center justify-between rounded-2xl border border-sky-200/15 bg-slate-900/70 px-4 py-3"
                        >
                          <span className="text-sm text-sky-50">{label}</span>
                          <input
                            type="checkbox"
                            checked={devices.consent[key as keyof typeof devices.consent]}
                            onChange={(e) =>
                              setDevices({
                                ...devices,
                                consent: {
                                  ...devices.consent,
                                  [key]: e.target.checked,
                                },
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {(["private", "open", "negotiable"] as PrivacyMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setPrivacyMode(mode)}
                          className={`rounded-full px-4 py-2 text-sm ${
                            privacyMode === mode
                              ? "bg-sky-300 text-slate-950"
                              : "border border-sky-300/25 bg-slate-900/60 text-sky-100"
                          }`}
                        >
                          {mode === "private"
                            ? "Private 完全私密"
                            : mode === "open"
                            ? "Open 默认共享"
                            : "Negotiable 每次询问"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "map" && (
                <div className="mt-6 space-y-6">
                  <div>
                    <h1 className="text-3xl font-semibold text-white md:text-4xl">
                      System Map & Threshold Trust View
                    </h1>
                    <p className="mt-2 text-base leading-7 text-sky-100/80">
                      一打开就有“这个系统逻辑清楚、阈值透明、可靠可追踪”的感觉。
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-sky-200/15 bg-white/5 p-5">
                      <div className="text-lg font-semibold text-white">M1 Evidence Flow</div>
                      <div className="mt-4 space-y-3 text-sm text-sky-100/85">
                        <div className="rounded-2xl border border-sky-200/15 bg-slate-900/60 p-4">
                          Register 注册 → Submit Evidence 提交证据 → Admin Appraise 管理员审核 → Claim 领取 → Refund 退还
                        </div>
                        <div className="rounded-2xl border border-sky-200/15 bg-slate-900/60 p-4">
                          Threshold: shared + appraised + score available
                        </div>
                        <div className="rounded-2xl border border-sky-200/15 bg-slate-900/60 p-4">
                          MetaMask only appears on write actions / 只有写操作弹 MetaMask
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-sky-200/15 bg-white/5 p-5">
                      <div className="text-lg font-semibold text-white">M2 Cohort Logic</div>
                      <div className="mt-4 space-y-3 text-sm text-sky-100/85">
                        <div className="rounded-2xl border border-sky-200/15 bg-slate-900/60 p-4">
                          shared + appraised + quality ≥ minQuality 才能入组
                        </div>
                        <div className="rounded-2xl border border-sky-200/15 bg-slate-900/60 p-4">
                          Purchase → user 75% / treasury 15% / reserve 10%
                        </div>
                        <div className="rounded-2xl border border-sky-200/15 bg-slate-900/60 p-4">
                          getEvidenceMeta = owner / shared / appraised / quality / dataClass
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-sky-200/15 bg-white/5 p-5">
                      <div className="text-lg font-semibold text-white">M3 Mission Logic</div>
                      <div className="mt-4 space-y-3 text-sm text-sky-100/85">
                        <div className="rounded-2xl border border-sky-200/15 bg-slate-900/60 p-4">
                          Approve budget → Create mission → Join → Submit proof → Approve milestone
                        </div>
                        <div className="rounded-2xl border border-sky-200/15 bg-slate-900/60 p-4">
                          Reward first goes into registry claimable, not directly to wallet
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-sky-200/15 bg-white/5 p-5">
                      <div className="text-lg font-semibold text-white">Clinical + Behavior Threshold Layer</div>
                      <div className="mt-4 space-y-3 text-sm text-sky-100/85">
                        <div className="rounded-2xl border border-sky-200/15 bg-slate-900/60 p-4">
                          Screen load high + sleep poor + symptoms up = gentle risk elevation
                        </div>
                        <div className="rounded-2xl border border-sky-200/15 bg-slate-900/60 p-4">
                          Device streams are supportive evidence, not medical diagnosis
                        </div>
                        <div className="rounded-2xl border border-sky-200/15 bg-slate-900/60 p-4">
                          Privacy mode + traceability + bilingual explanation = trust
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-sky-200/15 bg-slate-900/65 p-5">
                    <div className="text-sm uppercase tracking-[0.35em] text-sky-200/80">
                      Mermaid-ready summary
                    </div>
                    <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl border border-sky-200/10 bg-slate-950/80 p-4 text-xs leading-6 text-sky-100/85">
{`flowchart TD
  A[Profile Intake] --> B[Lifestyle & History]
  B --> C[Wearables / API / Consent]
  C --> D[Evidence + Risk Understanding]
  D --> E[M1 Onchain Evidence Flow]
  E --> F[M2 Cohort Licensing]
  E --> G[M3 Recovery Missions]
  F --> H[User Claimable Reward]
  G --> H`}
                    </pre>
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={saveCurrentUser}
                  className="rounded-full bg-sky-300 px-6 py-3 text-base font-medium text-slate-950 transition hover:bg-sky-200"
                >
                  Save Profile 保存资料
                </button>
                {saveMessage && (
                  <div className="rounded-full border border-sky-200/20 bg-white/5 px-4 py-3 text-sm text-sky-100">
                    {saveMessage}
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-6">
              <section className="rounded-[28px] border border-sky-200/15 bg-slate-950/55 p-5 shadow-2xl backdrop-blur-xl">
                <div className="text-xs uppercase tracking-[0.35em] text-sky-200/80">
                  Trust Summary 可信摘要
                </div>
                <div className="mt-4 text-2xl font-semibold text-white">
                  Product reliability starts before smart contracts
                </div>

                <div className="mt-5 space-y-4">
                  <div className="rounded-3xl border border-sky-200/15 bg-white/5 p-4">
                    <div className="text-sm text-sky-200/80">Profile Completion</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{completion}%</div>
                  </div>

                  <div className="rounded-3xl border border-sky-200/15 bg-white/5 p-4">
                    <div className="text-sm text-sky-200/80">Privacy Mode</div>
                    <div className="mt-2 text-lg text-white">
                      {privacyMode === "private"
                        ? "Private 完全私密"
                        : privacyMode === "open"
                        ? "Open 默认共享"
                        : "Negotiable 每次询问"}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-sky-200/15 bg-white/5 p-4">
                    <div className="text-sm text-sky-200/80">Design Direction</div>
                    <div className="mt-2 text-sm leading-7 text-sky-100/85">
                      Deep blue → open sky blue, larger keywords, softer contrast,
                      less eye fatigue, bilingual by default, responsive for web / tablet / mobile.
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-sky-200/15 bg-slate-950/55 p-5 shadow-2xl backdrop-blur-xl">
                <div className="text-xs uppercase tracking-[0.35em] text-sky-200/80">
                  Free Demo Database 本地免费数据库
                </div>
                <div className="mt-4 space-y-4">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="rounded-3xl border border-sky-200/15 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-semibold text-white">
                            {u.profile.nickname || "Unnamed User"}
                          </div>
                          <div className="mt-1 text-sm text-sky-100/70">
                            {u.profile.city} · {u.profile.occupation}
                          </div>
                        </div>
                        <div className={`rounded-full border px-3 py-1 text-xs ${riskColor(u.profile.baselineRisk)}`}>
                          {u.profile.baselineRisk}
                        </div>
                      </div>

                      <div className="mt-3 text-sm leading-7 text-sky-100/80">
                        {u.profile.diagnosis}
                      </div>

                      <div className="mt-3 text-xs text-sky-200/70">
                        Created: {u.createdAt}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}