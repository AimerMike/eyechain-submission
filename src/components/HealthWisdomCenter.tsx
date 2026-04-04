import { useState, useEffect } from "react";
import DashboardPanel from "./DashboardPanel";
import type { RiskSubmission } from "./SubmitRiskEvent";
import { Search, Eye, Sun, Monitor, Armchair, Droplets, Pill, ThermometerSun, AlertTriangle, X } from "lucide-react";

interface Props {
  lastSubmission?: RiskSubmission | null;
}

interface WisdomCard {
  id: string;
  icon: React.ElementType;
  title: string;
  titleCn: string;
  category: string;
  description: string;
  descriptionCn: string;
}

const WISDOM_CARDS: WisdomCard[] = [
  {
    id: "20-20-20",
    icon: Eye,
    title: "20-20-20 Rule",
    titleCn: "20-20-20 法则",
    category: "Habits",
    description: "Every 20 minutes, look at something 20 feet away for 20 seconds. Reduces ciliary muscle fatigue and digital eye strain.",
    descriptionCn: "每20分钟，看20英尺远的物体20秒。减少睫状肌疲劳和数字视觉疲劳。",
  },
  {
    id: "posture",
    icon: Armchair,
    title: "Posture Correction",
    titleCn: "姿势矫正",
    category: "Habits",
    description: "Keep screen at eye level, 50-70cm distance. Lean back, not forward. Rest eyes closed for 5 minutes per hour.",
    descriptionCn: "保持屏幕与眼睛平齐，距离50-70厘米。向后靠，不要前倾。每小时闭眼休息5分钟。",
  },
  {
    id: "lutein",
    icon: Pill,
    title: "Lutein & Zeaxanthin",
    titleCn: "叶黄素与玉米黄质",
    category: "Supplements",
    description: "10-20mg daily lutein filters blue light at the macula. Found in kale, spinach, eggs. AREDS2 formula recommended.",
    descriptionCn: "每天10-20毫克叶黄素可过滤黄斑区蓝光。存在于羽衣甘蓝、菠菜、鸡蛋中。推荐AREDS2配方。",
  },
  {
    id: "hot-compress",
    icon: ThermometerSun,
    title: "Hot Compress Therapy",
    titleCn: "热敷疗法",
    category: "Supplements",
    description: "Apply 40-42°C warm compress for 10 minutes. Stimulates meibomian gland secretion, relieves dry eye symptoms.",
    descriptionCn: "以40-42°C温敷10分钟。刺激睑板腺分泌，缓解干眼症状。",
  },
  {
    id: "eye-drops",
    icon: Droplets,
    title: "Preservative-Free Eye Drops",
    titleCn: "不含防腐剂的眼药水",
    category: "Supplements",
    description: "Use preservative-free artificial tears 3-4 times daily. Avoid vasoconstrictors. Consult ophthalmologist for prescription drops.",
    descriptionCn: "每天使用3-4次不含防腐剂的人工泪液。避免血管收缩剂。处方眼药水请咨询眼科医生。",
  },
  {
    id: "lighting",
    icon: Sun,
    title: "Optimal Lighting",
    titleCn: "最佳照明",
    category: "Environment",
    description: "Incandescent lighting (白炽灯) is gentler than LED for prolonged use. Avoid direct screen glare. Use bias lighting behind monitors.",
    descriptionCn: "白炽灯照明在长时间使用时比LED更温和。避免屏幕直接眩光。在显示器后方使用偏置照明。",
  },
  {
    id: "screen",
    icon: Monitor,
    title: "LCD vs OLED Displays",
    titleCn: "LCD vs OLED 显示屏",
    category: "Environment",
    description: "OLED's PWM dimming causes flicker at low brightness (eye strain). LCD with DC dimming is better for extended sessions.",
    descriptionCn: "OLED在低亮度下的PWM调光会产生闪烁（视觉疲劳）。带DC调光的LCD更适合长时间使用。",
  },
];

interface SmartAlert {
  type: "duration" | "posture" | "symptom";
  title: string;
  message: string;
  cardId: string;
}

function getSmartAlerts(submission: RiskSubmission | null): SmartAlert[] {
  if (!submission) return [];
  const alerts: SmartAlert[] = [];

  if (submission.duration >= 40) {
    alerts.push({
      type: "duration",
      title: "FMEA Detection: Prolonged Exposure",
      message: "Suggestion: Apply 20-20-20 Rule immediately.\nFMEA检测：长时间暴露。建议：立即应用20-20-20法则。",
      cardId: "20-20-20",
    });
  }

  if (submission.posture >= 40) {
    alerts.push({
      type: "posture",
      title: "FMEA Detection: High Posture Load",
      message: "Posture Reset: Lean back and rest eyes for 10 minutes.\nFMEA检测：高姿态负荷。姿势重置：向后靠并闭眼休息10分钟。",
      cardId: "posture",
    });
  }

  if (submission.symptoms > 0) {
    alerts.push({
      type: "symptom",
      title: "Symptoms Detected",
      message: "Recommended: Hot compress therapy & clinical consultation.\n检测到症状。建议：热敷疗法并咨询眼科医生。",
      cardId: "hot-compress",
    });
  }

  return alerts;
}

export default function HealthWisdomCenter({ lastSubmission }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);

  useEffect(() => {
    const newAlerts = getSmartAlerts(lastSubmission);
    setAlerts(newAlerts);
    setDismissedAlerts(new Set());
  }, [lastSubmission]);

  const filteredCards = WISDOM_CARDS.filter(card => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      card.title.toLowerCase().includes(q) ||
      card.titleCn.includes(q) ||
      card.category.toLowerCase().includes(q) ||
      card.description.toLowerCase().includes(q)
    );
  });

  const categories = [...new Set(WISDOM_CARDS.map(c => c.category))];

  return (
    <DashboardPanel title="Health Wisdom Center" titleCn="眼健康知识中心" tag="10 · Wiki 百科" tagColor="green">
      {/* Smart Alerts */}
      {alerts.filter(a => !dismissedAlerts.has(a.type)).length > 0 && (
        <div className="space-y-2 mb-5">
          {alerts
            .filter(a => !dismissedAlerts.has(a.type))
            .map(alert => (
              <div key={alert.type} className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0 animate-pulse" />
                <div className="flex-1">
                  <p className="font-mono text-xs text-destructive font-bold">{alert.title}</p>
                  <p className="font-mono text-[10px] text-destructive/80 whitespace-pre-line mt-1">{alert.message}</p>
                </div>
                <button onClick={() => setDismissedAlerts(prev => new Set(prev).add(alert.type))} className="text-destructive/50 hover:text-destructive">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search guidance... 搜索指导..."
          className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Category Cards */}
      {categories.map(category => {
        const cards = filteredCards.filter(c => c.category === category);
        if (cards.length === 0) return null;
        return (
          <div key={category} className="mb-5">
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase mb-2">{category}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cards.map(card => (
                <div
                  key={card.id}
                  className="bg-muted rounded-lg p-4 border border-border hover:border-primary/40 transition-colors cursor-default"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <card.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">{card.title}</p>
                      <p className="text-xs text-muted-foreground">{card.titleCn}</p>
                      <p className="font-mono text-[10px] text-muted-foreground mt-2 leading-relaxed">{card.description}</p>
                      <p className="font-mono text-[10px] text-muted-foreground/70 mt-1">{card.descriptionCn}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </DashboardPanel>
  );
}
