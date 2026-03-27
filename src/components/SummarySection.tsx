import type { PaperAnalysis } from "@/types/paper";
import { FileText, AlignLeft } from "lucide-react";
import { useState } from "react";

interface SummarySectionProps {
  analysis: PaperAnalysis;
}

export function SummarySection({ analysis }: SummarySectionProps) {
  const [showDetailed, setShowDetailed] = useState(false);

  return (
    <div className="glass-card rounded-xl p-6 animate-slide-up space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg gradient-gold">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="font-display text-xl text-foreground">Summary</h2>
        </div>
        <button
          onClick={() => setShowDetailed(!showDetailed)}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <AlignLeft className="h-4 w-4" />
          {showDetailed ? "Short" : "Detailed"}
        </button>
      </div>

      <p className="text-muted-foreground leading-relaxed text-sm">
        {showDetailed ? analysis.detailedSummary : analysis.shortSummary}
      </p>
    </div>
  );
}
