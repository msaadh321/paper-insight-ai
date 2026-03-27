import type { PaperAnalysis } from "@/types/paper";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AnalysisChartsProps {
  analysis: PaperAnalysis;
}

const COLORS = [
  "hsl(36, 85%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(150, 60%, 45%)",
  "hsl(280, 60%, 55%)",
  "hsl(350, 65%, 55%)",
  "hsl(45, 80%, 55%)",
  "hsl(180, 55%, 45%)",
  "hsl(220, 60%, 55%)",
];

export function AnalysisCharts({ analysis }: AnalysisChartsProps) {
  const keywordData = analysis.keywords.slice(0, 8).map((kw) => {
    // Estimate frequency from how many times keyword appears in the detailed summary
    const fullText = `${analysis.detailedSummary} ${analysis.abstract} ${analysis.results}`.toLowerCase();
    const count = (fullText.match(new RegExp(kw.toLowerCase(), "g")) || []).length;
    return { keyword: kw.length > 12 ? kw.slice(0, 12) + "…" : kw, frequency: Math.max(count, 1) };
  });

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-xl p-5 animate-slide-up">
        <h3 className="font-display text-lg text-foreground mb-4">Topic Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={analysis.topicDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                dataKey="percentage"
                nameKey="topic"
                label={({ topic, percentage }) => `${topic} (${percentage}%)`}
                labelLine={false}
                fontSize={11}
              >
                {analysis.topicDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(220, 25%, 10%)",
                  border: "1px solid hsl(220, 20%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(220, 10%, 90%)",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "100ms" }}>
        <h3 className="font-display text-lg text-foreground mb-4">Keyword Frequency</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={keywordData} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="keyword"
                width={90}
                tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(220, 25%, 10%)",
                  border: "1px solid hsl(220, 20%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(220, 10%, 90%)",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="frequency" fill="hsl(36, 85%, 55%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "200ms" }}>
        <h3 className="font-display text-lg text-foreground mb-4">Named Entities</h3>
        <div className="grid grid-cols-2 gap-2">
          {analysis.entities.slice(0, 12).map((entity) => (
            <div key={entity.name} className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${
                entity.type === "person" ? "bg-blue-400" :
                entity.type === "organization" ? "bg-green-400" :
                entity.type === "method" ? "bg-purple-400" : "bg-primary"
              }`} />
              <span className="text-foreground truncate">{entity.name}</span>
              <span className="text-muted-foreground text-xs">({entity.type})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
