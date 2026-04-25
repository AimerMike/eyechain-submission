import { DAILY_TIPS } from "@/data/dailyTips";
import { SEEDED_USERS } from "@/data/reworkUsers";
import type { DailyTip, EyeProfile, IntakeDraft } from "@/types/rework";

const USERS_KEY = "eyechain.rework.users";
const DRAFT_KEY = "eyechain.rework.intakeDraft";
const TIP_KEY = "eyechain.rework.tipState";

export const defaultDraft: IntakeDraft = {
  basics: {
    fullName: "",
    ageRange: "25-34",
    region: "Hong Kong",
    language: "bilingual",
    contactPreference: "Email / 邮件",
  },
  vision: {
    myopiaDiopters: "6.00",
    surgeryHistory: "None / 无",
    diagnosisNotes: "",
    examFrequency: "Every 6 months / 每 6 个月",
    riskTags: ["dry-eye", "high-myopia"],
  },
  lifestyle: {
    screenHours: "8",
    sleepHours: "7",
    outdoorHours: "1.5",
    drynessLevel: "4",
    stressLevel: "5",
  },
  wearables: {
    connectedDeviceIds: ["watch-01", "google-fit"],
    permissionKeys: ["sleep", "activity", "heartRate", "ambientLight"],
    syncEnabled: true,
  },
  consent: {
    privacyMode: "negotiable",
    agreedItems: [
      "encrypt-storage",
      "onchain-proof",
      "change-permissions",
      "reward-eligible",
    ],
    uploadSummary: "OCT reports, exam notes, wearable summary, symptom log",
  },
};

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function ensureSeededUsers(): EyeProfile[] {
  const existing = safeRead<EyeProfile[]>(USERS_KEY, []);
  if (existing.length > 0) return existing;
  safeWrite(USERS_KEY, SEEDED_USERS);
  return SEEDED_USERS;
}

export function getAllProfiles(): EyeProfile[] {
  return ensureSeededUsers();
}

export function saveProfile(profile: EyeProfile) {
  const users = ensureSeededUsers();
  const next = [profile, ...users.filter((item) => item.id !== profile.id)];
  safeWrite(USERS_KEY, next);
  return next;
}

export function getDraft(): IntakeDraft {
  return safeRead<IntakeDraft>(DRAFT_KEY, defaultDraft);
}

export function saveDraft(draft: IntakeDraft) {
  safeWrite(DRAFT_KEY, draft);
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyTipForToday(): DailyTip {
  const dayIndex = Number(new Date().toISOString().slice(8, 10));
  return DAILY_TIPS[dayIndex % DAILY_TIPS.length];
}

export function isTodayTipDismissed(): boolean {
  const state = safeRead<{ date: string; dismissed: boolean } | null>(TIP_KEY, null);
  if (!state) return false;
  return state.date === getTodayKey() && state.dismissed;
}

export function dismissTodayTip() {
  safeWrite(TIP_KEY, { date: getTodayKey(), dismissed: true });
}
