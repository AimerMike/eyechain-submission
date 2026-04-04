import { useState } from "react";
import DashboardPanel from "./DashboardPanel";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";

export default function EducationalContext() {
  const [expanded, setExpanded] = useState(false);

  return (
    <DashboardPanel title="Educational Context" titleCn="教育背景知识" tag="09 · Learn 学习" tagColor="green">
      <p className="text-muted-foreground text-sm font-mono mb-4">
        Understanding the causal chain between physical activity and retinal health risk.
        <br />了解身体活动与视网膜健康风险之间的因果链。
      </p>

      <div className="space-y-3 mb-4">
        <div className="bg-muted rounded-lg p-4 border border-border">
          <p className="font-mono text-xs text-primary tracking-wider uppercase mb-2">CAUSAL CHAIN 1: PHYSICAL IMPACT 物理冲击</p>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-foreground">
            <span className="bg-card px-2 py-1 rounded border border-border">High G-Force Activity<br/>高G力活动</span>
            <span className="text-primary">→</span>
            <span className="bg-card px-2 py-1 rounded border border-border">Vitreous Body Stress<br/>玻璃体应力</span>
            <span className="text-primary">→</span>
            <span className="bg-card px-2 py-1 rounded border border-border">Retinal Traction<br/>视网膜牵拉</span>
            <span className="text-primary">→</span>
            <span className="bg-destructive/20 px-2 py-1 rounded border border-destructive/30 text-destructive">Detachment Risk<br/>脱离风险</span>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground mt-2">
            Activities above 5G (roller coasters, bungee jumping, contact sports) can cause acute vitreous displacement.
            <br/>超过5G的活动（过山车、蹦极、接触性运动）可导致急性玻璃体移位。
          </p>
        </div>

        <div className="bg-muted rounded-lg p-4 border border-border">
          <p className="font-mono text-xs text-primary tracking-wider uppercase mb-2">CAUSAL CHAIN 2: POSTURAL STRESS 姿态压力</p>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-foreground">
            <span className="bg-card px-2 py-1 rounded border border-border">Prolonged Screen Use<br/>长时间使用屏幕</span>
            <span className="text-primary">→</span>
            <span className="bg-card px-2 py-1 rounded border border-border">Intraocular Pressure ↑<br/>眼内压升高</span>
            <span className="text-primary">→</span>
            <span className="bg-card px-2 py-1 rounded border border-border">Ciliary Muscle Fatigue<br/>睫状肌疲劳</span>
            <span className="text-primary">→</span>
            <span className="bg-amber/20 px-2 py-1 rounded border border-amber/30 text-amber">Myopia Progression<br/>近视加深</span>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground mt-2">
            Head-down posture for &gt;2h continuously raises IOP by 2-4 mmHg, compounding risk for susceptible individuals.
            <br/>连续低头姿势超过2小时可使眼内压升高2-4 mmHg，增加易感人群的风险。
          </p>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 font-mono text-xs text-primary hover:text-primary/80 transition-colors"
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {expanded ? "Collapse Details 收起详情" : "Expand Details 展开详情"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 animate-fade-in-up">
          <div className="bg-muted rounded-lg p-4 border border-border">
            <p className="font-mono text-xs text-primary tracking-wider uppercase mb-2">RISK FACTOR WEIGHTS 风险因子权重</p>
            <div className="space-y-2">
              {[
                { label: "Acceleration Load 加速度负荷", weight: 25, color: "bg-primary" },
                { label: "Posture Load 姿态负荷", weight: 20, color: "bg-magenta" },
                { label: "Duration Score 持续时间评分", weight: 20, color: "bg-amber" },
                { label: "Baseline Vulnerability 基线脆弱性", weight: 25, color: "bg-cyan" },
                { label: "Symptom Flags 症状标记", weight: 10, color: "bg-neon-green" },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-muted-foreground w-44 shrink-0">{f.label}</span>
                  <div className="flex-1 bg-card rounded-full h-2 overflow-hidden">
                    <div className={`h-full ${f.color} rounded-full`} style={{ width: `${f.weight}%` }} />
                  </div>
                  <span className="font-mono text-xs text-foreground w-8 text-right">{f.weight}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4 border border-border">
            <p className="font-mono text-xs text-primary tracking-wider uppercase mb-2">CLINICAL REFERENCES 临床参考</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground font-mono">
              <li>• WHO Guidelines on Physical Activity and Sedentary Behavior (2020)<br/>世界卫生组织体力活动和久坐行为指南 (2020)</li>
              <li>• AAO Preferred Practice Pattern: Retinal Detachment (2024)<br/>美国眼科学会首选实践模式：视网膜脱离 (2024)</li>
              <li>• AREDS2 Study: Age-Related Eye Disease Risk Factors<br/>AREDS2 研究：年龄相关眼病风险因素</li>
            </ul>
          </div>
        </div>
      )}
    </DashboardPanel>
  );
}
