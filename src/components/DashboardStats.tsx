import { FileText, Clock, BarChart3, TrendingUp, Sparkles } from "lucide-react";
import type { PaperAnalysis } from "@/types/paper";

interface SavedAnalysis {
  id: string;
  title: string;
  paper_text: string;
  analysis: PaperAnalysis;
  created_at: string;
}

interface DashboardStatsProps {
  analyses: SavedAnalysis[];
}

export function DashboardStats({ analyses }: DashboardStatsProps) {
  const totalAnalyses = analyses.length;
  const totalKeywords = analyses.reduce((sum, a) => sum + (a.analysis?.keywords?.length || 0), 0);
  const totalEntities = analyses.reduce((sum, a) => sum + (a.analysis?.entities?.length || 0), 0);
  const latestDate = analyses.length ? new Date(analyses[0].created_at).toLocaleDateString() : "N/A";

  // Activity in last 7 days
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentCount = analyses.filter((a) => new Date(a.created_at) >= weekAgo).length;

  const stats = [
    { icon: FileText, label: "Total Analyses", value: totalAnalyses, color: "text-primary" },
    { icon: BarChart3, label: "Keywords Extracted", value: totalKeywords, color: "text-primary" },
    { icon: Sparkles, label: "Entities Found", value: totalEntities, color: "text-primary" },
    { icon: TrendingUp, label: "This Week", value: recentCount, color: "text-primary" },
    { icon: Clock, label: "Last Analysis", value: latestDate, color: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="glass-card rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:border-primary/20 transition-colors">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <p className="text-xl font-display text-foreground">{value}</p>
          <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
        </div>
      ))}
    </div>
  );
}
