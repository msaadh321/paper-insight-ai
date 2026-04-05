import { useState } from "react";
import type { PaperAnalysis } from "@/types/paper";
import { BookOpen, FlaskConical, Target, CheckCircle, Lightbulb, FileText } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { AnalysisComments } from "@/components/AnalysisComments";
import { TextToSpeech } from "@/components/TextToSpeech";
import { useAuth } from "@/hooks/useAuth";

interface InsightsSectionProps {
  analysis: PaperAnalysis;
  analysisId?: string;
}

const sections = [
  { key: "abstract", label: "Abstract", icon: FileText },
  { key: "introduction", label: "Introduction", icon: BookOpen },
  { key: "methodology", label: "Methodology", icon: FlaskConical },
  { key: "results", label: "Results", icon: Target },
  { key: "conclusion", label: "Conclusion", icon: CheckCircle },
] as const;

export function InsightsSection({ analysis, analysisId }: InsightsSectionProps) {
  const { user } = useAuth();
  const [translations, setTranslations] = useState<Record<string, { text: string; lang: string }>>({});

  const getDisplayText = (key: string, original: string) => {
    const t = translations[key];
    return t ? t.text : original;
  };

  return (
    <div className="space-y-4">
      {sections.map(({ key, label, icon: Icon }, i) => (
        <div
          key={key}
          className="glass-card rounded-xl p-5 animate-slide-up"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-display text-lg text-foreground">{label}</h3>
            </div>
            <LanguageToggle
              text={analysis[key]}
              onTranslated={(translated, lang) =>
                setTranslations((prev) => ({ ...prev, [key]: { text: translated, lang } }))
              }
            />
          </div>
          <p className={`text-sm leading-relaxed ${
            translations[key]?.lang === "ur" ? "text-right font-[Noto_Naskh_Arabic] text-foreground" : "text-muted-foreground"
          }`} dir={translations[key]?.lang === "ur" ? "rtl" : "ltr"}>
            {getDisplayText(key, analysis[key])}
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
            <span key={kw} className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Comments section */}
      {user && analysisId && (
        <div className="animate-slide-up" style={{ animationDelay: "600ms" }}>
          <AnalysisComments analysisId={analysisId} />
        </div>
      )}
    </div>
  );
}
