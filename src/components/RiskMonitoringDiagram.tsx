import DashboardPanel from "./DashboardPanel";
import { Activity, Eye, Brain, Shield, AlertTriangle, ArrowDown, X as Multiply } from "lucide-react";

export default function RiskMonitoringDiagram() {
  return (
    <DashboardPanel title="FMEA Risk Monitoring Logic" titleCn="FMEA 风险优先数监控逻辑" tag="08 · Algorithm 算法" tagColor="cyan">
      <p className="text-muted-foreground text-sm font-mono mb-6">
        EyeChain uses an <strong className="text-foreground">FMEA-based RPN (Risk Priority Number)</strong> model.
        A high score in ANY single category exponentially increases total risk.
        <br />EyeChain 采用 <strong className="text-foreground">FMEA 风险优先数 (RPN)</strong> 模型。任何单一类别的高分都会指数级增加总风险。
      </p>

      <div className="space-y-4">
        {/* Input Factors */}
        <div>
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest mb-2">FMEA FACTORS (1-10 SCALE) · FMEA 因子 (1-10 量表)</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Activity, label: "Severity\n严重度", desc: "Acceleration\n加速度", color: "text-destructive" },
              { icon: Brain, label: "Occurrence\n发生度", desc: "Duration\n持续时间", color: "text-amber" },
              { icon: Eye, label: "Detection\n检测难度", desc: "Posture\n姿态负荷", color: "text-primary" },
            ].map((item, i) => (
              <div key={i} className="bg-muted rounded-lg p-3 text-center border border-border">
                <item.icon className={`w-5 h-5 ${item.color} mx-auto mb-1`} />
                <p className="font-mono text-[10px] text-foreground whitespace-pre-line font-bold">{item.label}</p>
                <p className="font-mono text-[10px] text-muted-foreground whitespace-pre-line mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Multiplication formula */}
        <div className="flex items-center justify-center gap-2 py-2">
          <span className="font-mono text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">S</span>
          <span className="font-heading text-lg text-muted-foreground">×</span>
          <span className="font-mono text-xs text-amber bg-amber/10 px-2 py-1 rounded">O</span>
          <span className="font-heading text-lg text-muted-foreground">×</span>
          <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded">D</span>
          <span className="font-heading text-lg text-muted-foreground">×</span>
          <span className="font-mono text-xs text-foreground bg-muted px-2 py-1 rounded">Symptom</span>
          <span className="font-heading text-lg text-muted-foreground">=</span>
          <span className="font-mono text-xs text-foreground bg-muted px-2 py-1 rounded font-bold">RPN</span>
        </div>

        <div className="flex justify-center">
          <ArrowDown className="w-5 h-5 text-primary animate-pulse" />
        </div>

        {/* Processing */}
        <div className="bg-muted rounded-lg p-4 border border-primary/30">
          <p className="font-mono text-[10px] text-primary tracking-widest mb-2">RPN CALCULATION · RPN 计算引擎</p>
          <div className="bg-card rounded p-3 border border-border">
            <p className="font-mono text-xs text-foreground">
              RPN = Severity × Occurrence × Detection × SymptomMultiplier
            </p>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">
              风险优先数 = 严重度 × 发生度 × 检测难度 × 症状系数
            </p>
          </div>
          <div className="mt-3 p-3 bg-destructive/5 border border-destructive/20 rounded">
            <p className="font-mono text-[10px] text-destructive">
              ⚠ MULTIPLICATION EFFECT: A single factor at 10 with others at 5 → RPN = 250.
              But TWO factors at 10 → RPN = 500. This is the exponential escalation principle.
              <br />⚠ 乘法效应：单一因子为10，其余为5 → RPN=250。两个因子为10 → RPN=500。这就是指数级升级原则。
            </p>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Shield className="w-4 h-4 text-neon-green" />
            <p className="font-mono text-[10px] text-muted-foreground">Score mapped to 0–100 for clinical readability / 评分映射至 0–100 便于临床解读</p>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowDown className="w-5 h-5 text-primary animate-pulse" />
        </div>

        {/* Output */}
        <div>
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest mb-2">OUTPUT CLASSIFICATION 输出分类</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-3 text-center">
              <p className="font-heading text-lg font-bold text-neon-green">0–39</p>
              <p className="font-mono text-[10px] text-neon-green">NORMAL 正常</p>
            </div>
            <div className="bg-amber/10 border border-amber/30 rounded-lg p-3 text-center">
              <p className="font-heading text-lg font-bold text-amber">40–69</p>
              <p className="font-mono text-[10px] text-amber">WARNING 警告</p>
            </div>
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
              <p className="font-heading text-lg font-bold text-destructive">70–100</p>
              <p className="font-mono text-[10px] text-destructive">CRITICAL 危急</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}
