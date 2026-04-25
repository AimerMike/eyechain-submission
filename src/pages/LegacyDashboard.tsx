import { useWallet } from "@/lib/useWallet";
import { shortenAddress } from "@/lib/contract";
import RiskMonitoringDiagram from "@/components/RiskMonitoringDiagram";
import EducationalContext from "@/components/EducationalContext";
import MedicalLog from "@/components/MedicalLog";

const NAV_ITEMS = [
  "Connect 连接",
  "Register 注册",
  "Risk 风险",
  "Overview 概览",
  "Monetize 变现",
  "Requests 请求",
  "History 历史",
  "Admin 管理",
  "Algorithm 算法",
  "Learn 学习",
  "Wiki 百科",
  "Log 日志",
  "Evidence 证据",
];

function LegacyBlock({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
        Legacy Module
      </p>
      <h2 className="font-heading text-2xl mt-2">{title}</h2>
      <p className="text-sm text-muted-foreground mt-3 leading-7">{description}</p>
      <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
        <p className="font-mono text-xs text-muted-foreground">
          Preserved as original EyeChain dashboard structure. Interactive legacy
          contract wiring is intentionally disabled to avoid conflicts with the new
          M1 contributor flow.
        </p>
      </div>
    </section>
  );
}

export default function LegacyDashboard() {
  const { account, isFuji, connectWallet } = useWallet();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="font-heading text-2xl tracking-wider">EYECHAIN</p>
            <p className="font-mono text-xs text-muted-foreground tracking-widest">
              Legacy Dashboard · 原始总览页资产回挂
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all whitespace-nowrap"
            >
              Back to M1 返回 M1
            </a>

            {!account ? (
              <button
                onClick={connectWallet}
                className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all whitespace-nowrap"
              >
                Connect Wallet 连接钱包
              </button>
            ) : (
              <div className="px-4 py-2 rounded-lg font-mono text-xs tracking-widest uppercase border border-border text-muted-foreground whitespace-nowrap">
                {shortenAddress(account)}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {NAV_ITEMS.map((item, i) => (
            <button
              key={item}
              onClick={() => scrollTo(`legacy-section-${i}`)}
              className="font-mono text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all whitespace-nowrap tracking-wider uppercase"
            >
              {item}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <section
          id="legacy-section-0"
          className="rounded-2xl border border-border bg-card p-6"
        >
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase">
            Legacy Overview 原始成果总览
          </p>
          <h1 className="font-heading text-4xl mt-3">EyeChain Original Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-4 leading-7">
            这是 EyeChain 的原始大盘页，用来保留你最初 lovable 原型中的系统结构：
            风险输入、概览、变现、请求、历史、管理、算法、学习、百科、日志、证据。
            这个页面当前以成果展示和产品脉络说明为主，不再强行挂旧交互逻辑，避免与
            新 M1 Fuji contributor flow 冲突。
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
                Current Wallet
              </p>
              <p className="font-mono text-sm mt-2 break-all">
                {account || "Not connected / 未连接"}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
                Network
              </p>
              <p className="font-mono text-sm mt-2">
                {isFuji ? "Fuji connected / 已连接 Fuji" : "Not on Fuji / 当前非 Fuji"}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
                Purpose
              </p>
              <p className="font-mono text-sm mt-2">
                Original product architecture + knowledge assets
              </p>
            </div>
          </div>
        </section>

        <div id="legacy-section-1">
          <LegacyBlock
            title="User Registration 注册"
            description="原始 MVP 的用户注册模块，承接 retinal risk baseline、surgery type、laser count、sharing level 等信息架构。"
          />
        </div>

        <div id="legacy-section-2">
          <LegacyBlock
            title="Risk Submission 风险提交"
            description="原始行为/症状风险输入模块，是 EyeChain 从预防与监测视角切入的起点。"
          />
        </div>

        <div id="legacy-section-3">
          <LegacyBlock
            title="Health Data Overview 健康数据概览"
            description="承接原始用户画像、链上状态、风险历史与说明性总览。"
          />
        </div>

        <div id="legacy-section-4">
          <LegacyBlock
            title="Data Sharing / Monetization 数据共享与变现"
            description="这是原始 lovable 原型中最重要的成果之一，展示用户奖励、机构购买、收入拆分与协议价值。"
          />
        </div>

        <div id="legacy-section-5">
          <LegacyBlock
            title="Data Access Requests 数据请求"
            description="展示 EyeChain 作为双边/多边网络的另一面：不仅服务用户，也面向研究和机构需求。"
          />
        </div>

        <div id="legacy-section-6">
          <LegacyBlock
            title="Transaction History 历史记录"
            description="原始历史和追踪视图，用来承接长期监测与链上痕迹。"
          />
        </div>

        <div id="legacy-section-7">
          <LegacyBlock
            title="Admin Controls 管理入口"
            description="原始后台/管理员区。当前保留结构，不恢复旧交互。"
          />
        </div>

        <div id="legacy-section-8">
          <RiskMonitoringDiagram />
        </div>

        <div id="legacy-section-9">
          <EducationalContext />
        </div>

        <div id="legacy-section-10">
          <LegacyBlock
            title="Health Wisdom Center 健康知识中心"
            description="原始教育和解释层，用来帮助高风险眼病用户理解行为、症状、预防与追踪的关系。"
          />
        </div>

        <div id="legacy-section-11">
          <MedicalLog />
        </div>

        <div id="legacy-section-12">
          <LegacyBlock
            title="Evidence Center 证据中心"
            description="这是从原始 dashboard 演进到 patient-owned evidence network 的桥梁；新 M1 已把它收敛为 Fuji 上的贡献者证据流程。"
          />
        </div>

        <footer className="mt-12 border-t border-border/50 pt-6 pb-8 text-center">
          <p className="font-mono text-xs text-muted-foreground tracking-widest">
            EYECHAIN · LEGACY DASHBOARD · ORIGINAL PRODUCT ASSETS PRESERVED
          </p>
          <p className="font-mono text-xs text-muted-foreground tracking-wider mt-1">
            眼链 · 原始总览页 · 产品沉淀与结构资产保留
          </p>
        </footer>
      </main>
    </div>
  );
}