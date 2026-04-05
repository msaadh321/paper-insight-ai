import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Tag } from "lucide-react";
import type { PaperAnalysis } from "@/types/paper";

interface SavedAnalysis {
  id: string;
  title: string;
  paper_text: string;
  analysis: PaperAnalysis;
  created_at: string;
}

interface ActivityChartsProps {
  analyses: SavedAnalysis[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent-foreground))",
  "hsl(var(--muted-foreground))",
  "hsl(45 93% 47%)",
  "hsl(160 60% 45%)",
  "hsl(280 60% 55%)",
];

export function ActivityCharts({ analyses }: ActivityChartsProps) {
  // Activity over last 14 days
  const activityData = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en", { month: "short", day: "numeric" });
      const count = analyses.filter((a) => a.created_at.slice(0, 10) === key).length;
      days.push({ date: label, count });
    }
    return days;
  }, [analyses]);

  // Top keywords
  const keywordData = useMemo(() => {
    const freq: Record<string, number> = {};
    analyses.forEach((a) => {
      a.analysis?.keywords?.forEach((kw) => {
        freq[kw] = (freq[kw] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([keyword, count]) => ({ keyword, count }));
  }, [analyses]);

  // Topic distribution aggregate
  const topicData = useMemo(() => {
    const agg: Record<string, number> = {};
    analyses.forEach((a) => {
      a.analysis?.topicDistribution?.forEach((t) => {
        agg[t.topic] = (agg[t.topic] || 0) + t.percentage;
      });
    });
    return Object.entries(agg)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [analyses]);

  if (analyses.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Activity Timeline */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h4 className="font-display text-sm text-foreground">Analysis Activity</h4>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={activityData}>
            <defs>
              <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={20} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#actGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Keywords */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="h-4 w-4 text-primary" />
          <h4 className="font-display text-sm text-foreground">Top Keywords</h4>
        </div>
        {keywordData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={keywordData} layout="vertical" margin={{ left: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="keyword" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-8">No keyword data yet</p>
        )}
      </div>

      {/* Topic Distribution */}
      {topicData.length > 0 && (
        <div className="glass-card rounded-xl p-5 lg:col-span-2">
          <h4 className="font-display text-sm text-foreground mb-4">Aggregate Topic Distribution</h4>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={topicData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {topicData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5">
              {topicData.map((t, i) => (
                <div key={t.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground truncate max-w-[140px]">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
