import DashboardPanel from "./DashboardPanel";
import { Activity, Eye, Brain, Shield, AlertTriangle, ArrowRight, ArrowDown } from "lucide-react";

export default function RiskMonitoringDiagram() {
  return (
    <DashboardPanel title="Risk Monitoring Logic" titleCn="实时个性化风险监控逻辑" tag="08 · Algorithm 算法" tagColor="cyan">
      <p className="text-muted-foreground text-sm font-mono mb-6">
        Visual representation of how EyeChain processes real-time data into personalized risk levels.
        <br />EyeChain 如何将实时数据处理为个性化风险等级的可视化表示。
      </p>

      <div className="space-y-4">
        {/* Input Layer */}
        <div>
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest mb-2">INPUT LAYER 输入层</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { icon: Activity, label: "Acceleration\n加速度", weight: "25%" },
              { icon: Eye, label: "Posture\n姿态", weight: "20%" },
              { icon: Brain, label: "Duration\n持续时间", weight: "20%" },
              { icon: AlertTriangle, label: "Symptoms\n症状", weight: "10%" },
            ].map((item, i) => (
              <div key={i} className="bg-muted rounded-lg p-3 text-center border border-border">
                <item.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="font-mono text-[10px] text-foreground whitespace-pre-line">{item.label}</p>
                <p className="font-mono text-[10px] text-cyan mt-1">W: {item.weight}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowDown className="w-5 h-5 text-primary animate-pulse" />
        </div>

        {/* Processing Layer */}
        <div className="bg-muted rounded-lg p-4 border border-primary/30">
          <p className="font-mono text-[10px] text-primary tracking-widest mb-2">PROCESSING 处理引擎</p>
          <div className="bg-card rounded p-3 border border-border">
            <p className="font-mono text-xs text-foreground">
              Health Score = (25×Accel + 20×Posture + 20×Duration + 25×BaselineVuln + 10×Symptoms) / 100
            </p>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">
              健康评分 = (25×加速度 + 20×姿态 + 20×时长 + 25×基线脆弱性 + 10×症状) / 100
            </p>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Shield className="w-4 h-4 text-neon-green" />
            <p className="font-mono text-[10px] text-muted-foreground">+ Baseline vulnerability from UserProfile registration data / 加上用户注册的基线脆弱性数据</p>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowDown className="w-5 h-5 text-primary animate-pulse" />
        </div>

        {/* Output Layer */}
        <div>
          <p className="font-mono text-[10px] text-muted-foreground tracking-widest mb-2">OUTPUT CLASSIFICATION 输出分类</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-3 text-center">
              <p className="font-heading text-lg font-bold text-neon-green">0–69</p>
              <p className="font-mono text-[10px] text-neon-green">NORMAL 正常</p>
            </div>
            <div className="bg-amber/10 border border-amber/30 rounded-lg p-3 text-center">
              <p className="font-heading text-lg font-bold text-amber">70–84</p>
              <p className="font-mono text-[10px] text-amber">WARNING 警告</p>
            </div>
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
              <p className="font-heading text-lg font-bold text-destructive">85–100</p>
              <p className="font-mono text-[10px] text-destructive">CRITICAL 危急</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}
