import type { PaperAnalysis } from "@/types/paper";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Treemap,
} from "recharts";

interface AnalysisChartsProps {
  analysis: PaperAnalysis;
}

const COLORS = [
  "hsl(36, 85%, 55%)", "hsl(200, 70%, 50%)", "hsl(150, 60%, 45%)",
  "hsl(280, 60%, 55%)", "hsl(350, 65%, 55%)", "hsl(45, 80%, 55%)",
  "hsl(180, 55%, 45%)", "hsl(220, 60%, 55%)",
];

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--foreground))",
  fontSize: "12px",
};

export function AnalysisCharts({ analysis }: AnalysisChartsProps) {
  const fullText = `${analysis.detailedSummary} ${analysis.abstract} ${analysis.results}`.toLowerCase();

  const keywordData = analysis.keywords.slice(0, 10).map((kw) => {
    const count = (fullText.match(new RegExp(kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g")) || []).length;
    return { keyword: kw.length > 14 ? kw.slice(0, 14) + "…" : kw, frequency: Math.max(count, 1) };
  });

  // Word cloud data from keywords
  const wordCloudData = analysis.keywords.map((kw, i) => ({
    name: kw,
    size: Math.max(800 - i * 60, 200),
    fill: COLORS[i % COLORS.length],
  }));

  // Radar chart for section coverage
  const sectionLengths = [
    { section: "Abstract", length: analysis.abstract?.length || 0 },
    { section: "Intro", length: analysis.introduction?.length || 0 },
    { section: "Method", length: analysis.methodology?.length || 0 },
    { section: "Results", length: analysis.results?.length || 0 },
    { section: "Conclusion", length: analysis.conclusion?.length || 0 },
  ];
  const maxLen = Math.max(...sectionLengths.map((s) => s.length), 1);
  const radarData = sectionLengths.map((s) => ({
    ...s,
    coverage: Math.round((s.length / maxLen) * 100),
  }));

  // Entity type distribution
  const entityTypes = analysis.entities.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});
  const entityData = Object.entries(entityTypes).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  return (
    <div className="space-y-6">
      {/* Topic Distribution Donut */}
      <div className="glass-card rounded-xl p-5 animate-slide-up">
        <h3 className="font-display text-lg text-foreground mb-4">Topic Distribution</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={analysis.topicDistribution}
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={50}
                dataKey="percentage"
                nameKey="topic"
                label={({ topic, percentage }) => `${topic} (${percentage}%)`}
                labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                fontSize={10}
                strokeWidth={2}
                stroke="hsl(var(--background))"
              >
                {analysis.topicDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-column row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Keyword Frequency */}
        <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <h3 className="font-display text-lg text-foreground mb-4">Keyword Frequency</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={keywordData} layout="vertical" margin={{ left: 5 }}>
                <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <YAxis type="category" dataKey="keyword" width={100} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="frequency" radius={[0, 6, 6, 0]}>
                  {keywordData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section Coverage Radar */}
        <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "150ms" }}>
          <h3 className="font-display text-lg text-foreground mb-4">Section Coverage</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="section" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar
                  name="Coverage"
                  dataKey="coverage"
                  stroke="hsl(36, 85%, 55%)"
                  fill="hsl(36, 85%, 55%)"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Keyword Cloud via Treemap */}
      <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "200ms" }}>
        <h3 className="font-display text-lg text-foreground mb-4">Keyword Cloud</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={wordCloudData}
              dataKey="size"
              stroke="hsl(var(--background))"
              content={({ x, y, width, height, name, fill }: any) => {
                if (width < 30 || height < 20) return null;
                return (
                  <g>
                    <rect x={x} y={y} width={width} height={height} rx={4} fill={fill} fillOpacity={0.2} stroke={fill} strokeWidth={1} />
                    <text
                      x={x + width / 2}
                      y={y + height / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={fill}
                      fontSize={Math.min(width / (name?.length || 5) * 1.4, 14, height * 0.5)}
                      fontWeight={600}
                    >
                      {name}
                    </text>
                  </g>
                );
              }}
            />
          </ResponsiveContainer>
        </div>
      </div>

      {/* Entity Types + Named Entities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "250ms" }}>
          <h3 className="font-display text-lg text-foreground mb-4">Entity Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={entityData} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name" label fontSize={11}>
                  {entityData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "300ms" }}>
          <h3 className="font-display text-lg text-foreground mb-4">Named Entities</h3>
          <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto">
            {analysis.entities.slice(0, 16).map((entity) => (
              <div key={entity.name} className="flex items-center gap-2 text-sm">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  entity.type === "person" ? "bg-blue-400" :
                  entity.type === "organization" ? "bg-green-400" :
                  entity.type === "method" ? "bg-purple-400" :
                  entity.type === "dataset" ? "bg-amber-400" :
                  entity.type === "metric" ? "bg-rose-400" :
                  "bg-primary"
                }`} />
                <span className="text-foreground truncate">{entity.name}</span>
                <span className="text-muted-foreground text-xs ml-auto shrink-0">({entity.type})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
