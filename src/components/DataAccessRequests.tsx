import { useState } from "react";
import DashboardPanel from "./DashboardPanel";

interface AccessRequest {
  id: number;
  researcher: string;
  purpose: string;
  status: "Pending" | "Approved";
}

const MOCK_REQUESTS: AccessRequest[] = [
  { id: 1, researcher: "Dr. Zhang — Beijing Eye Institute", purpose: "Myopia progression study", status: "Pending" },
  { id: 2, researcher: "Oxford Retinal Lab", purpose: "AI-based retinal screening", status: "Pending" },
  { id: 3, researcher: "WHO Vision Programme", purpose: "Global eye health statistics", status: "Approved" },
];

export default function DataAccessRequests({ address }: { address: string | null }) {
  const [requests, setRequests] = useState<AccessRequest[]>(MOCK_REQUESTS);

  const handleApprove = (id: number) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "Approved" as const } : r));
  };

  return (
    <DashboardPanel title="Data Access Requests" tag="05 · Requests" tagColor="cyan">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left font-mono text-xs text-muted-foreground py-2 pr-4">RESEARCHER</th>
              <th className="text-left font-mono text-xs text-muted-foreground py-2 pr-4">PURPOSE</th>
              <th className="text-left font-mono text-xs text-muted-foreground py-2 pr-4">STATUS</th>
              <th className="text-right font-mono text-xs text-muted-foreground py-2">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} className="border-b border-border/50">
                <td className="py-3 pr-4 text-foreground">{r.researcher}</td>
                <td className="py-3 pr-4 text-muted-foreground">{r.purpose}</td>
                <td className="py-3 pr-4">
                  <span className={`font-mono text-xs px-2 py-0.5 rounded border ${r.status === "Approved" ? "text-neon-green border-neon-green/50" : "text-amber border-amber/50"}`}>
                    {r.status}
                  </span>
                </td>
                <td className="py-3 text-right">
                  {r.status === "Pending" && (
                    <button onClick={() => handleApprove(r.id)} disabled={!address} className="font-mono text-xs px-3 py-1 rounded border border-primary/50 text-primary hover:bg-primary/10 transition-all disabled:opacity-50">
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardPanel>
  );
}
