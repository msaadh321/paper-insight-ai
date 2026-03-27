import type { PaperAnalysis } from "@/types/paper";
import { BookOpen, FlaskConical, Target, CheckCircle, Lightbulb, FileText } from "lucide-react";

interface InsightsSectionProps {
  analysis: PaperAnalysis;
}

const sections = [
  { key: "abstract", label: "Abstract", icon: FileText },
  { key: "introduction", label: "Introduction", icon: BookOpen },
  { key: "methodology", label: "Methodology", icon: FlaskConical },
  { key: "results", label: "Results", icon: Target },
  { key: "conclusion", label: "Conclusion", icon: CheckCircle },
] as const;

export function InsightsSection({ analysis }: InsightsSectionProps) {
  return (
    <div className="space-y-4">
      {sections.map(({ key, label, icon: Icon }, i) => (
        <div
          key={key}
          className="glass-card rounded-xl p-5 animate-slide-up"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-display text-lg text-foreground">{label}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {analysis[key]}
          </p>
        </div>
      ))}

      <div className="glass-card rounded-xl p-5 animate-slide-up" style={{ animationDelay: "500ms" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-display text-lg text-foreground">Keywords</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.keywords.map((kw) => (
            <span
              key={kw}
              className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
