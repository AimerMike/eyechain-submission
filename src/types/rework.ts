export type LanguageCode = "en" | "zh" | "bilingual";

export type VisionRiskTag =
  | "dry-eye"
  | "high-myopia"
  | "glaucoma-risk"
  | "diabetes-risk"
  | "post-op"
  | "retina-risk";

export type DeviceConnectionState = "connected" | "syncing" | "available" | "disconnected";

export interface WearableDevice {
  id: string;
  name: string;
  nameZh: string;
  brand: string;
  state: DeviceConnectionState;
  metricKeys: string[];
  lastSyncMinutesAgo?: number;
  batteryPct?: number;
}

export interface EyeProfile {
  id: string;
  displayName: string;
  ageRange: string;
  region: string;
  language: LanguageCode;
  occupation: string;
  screenHours: number;
  sleepHours: number;
  outdoorHours: number;
  dryEyeLevel: number;
  myopiaDiopters: number;
  iopRisk: "low" | "medium" | "high";
  riskTags: VisionRiskTag[];
  devices: WearableDevice[];
  uploadsCount: number;
  consentMode: "private" | "open" | "negotiable";
  createdAt: string;
  updatedAt: string;
}

export interface IntakeDraft {
  basics: {
    fullName: string;
    ageRange: string;
    region: string;
    language: LanguageCode;
    contactPreference: string;
  };
  vision: {
    myopiaDiopters: string;
    surgeryHistory: string;
    diagnosisNotes: string;
    examFrequency: string;
    riskTags: VisionRiskTag[];
  };
  lifestyle: {
    screenHours: string;
    sleepHours: string;
    outdoorHours: string;
    drynessLevel: string;
    stressLevel: string;
  };
  wearables: {
    connectedDeviceIds: string[];
    permissionKeys: string[];
    syncEnabled: boolean;
  };
  consent: {
    privacyMode: "private" | "open" | "negotiable";
    agreedItems: string[];
    uploadSummary: string;
  };
}

export interface ThresholdRule {
  id: string;
  label: string;
  labelZh: string;
  metric: string;
  value: number;
  unit: string;
  direction: "min" | "max" | "range";
  range?: [number, number];
  severity: "normal" | "attention" | "warning" | "critical";
  rationale: string;
  rationaleZh: string;
}

export interface DailyTip {
  id: string;
  title: string;
  titleZh: string;
  body: string;
  bodyZh: string;
  category: "screen" | "dry-eye" | "environment" | "metabolic" | "exercise" | "urgent";
}
