import { useState } from "react";
import { Loader2, GraduationCap, BarChart3, MessageCircle, Sparkles, BookOpen } from "lucide-react";
import { PaperUpload } from "@/components/PaperUpload";
import { SummarySection } from "@/components/SummarySection";
import { InsightsSection } from "@/components/InsightsSection";
import { AnalysisCharts } from "@/components/AnalysisCharts";
import { QASection } from "@/components/QASection";
import { analyzePaper } from "@/lib/api";
import type { PaperAnalysis } from "@/types/paper";
import { toast } from "sonner";

type Tab = "summary" | "insights" | "charts" | "qa";

const Index = () => {
  const [paperText, setPaperText] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<PaperAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("summary");

  const handleAnalyze = async (text: string) => {
    setPaperText(text);
    setLoading(true);
    try {
      const result = await analyzePaper(text);
      setAnalysis(result);
      setActiveTab("summary");
      toast.success("Paper analyzed successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPaperText(null);
    setAnalysis(null);
    setActiveTab("summary");
  };

  const tabs: { key: Tab; label: string; icon: typeof BookOpen }[] = [
    { key: "summary", label: "Summary", icon: BookOpen },
    { key: "insights", label: "Insights", icon: Sparkles },
    { key: "charts", label: "Visuals", icon: BarChart3 },
    { key: "qa", label: "Ask AI", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-gold shadow-gold">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl text-foreground">ResearchLens</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Paper Analysis</p>
            </div>
          </div>
          {analysis && (
            <button
              onClick={handleReset}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              New Analysis
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!analysis && !loading && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 animate-fade-in">
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-3">
                Understand Papers <span className="text-gradient-gold">Instantly</span>
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Upload any research paper and get AI-powered summaries, key insights, visual analytics, and an interactive Q&A — all in seconds.
              </p>
            </div>
            <PaperUpload onTextReady={handleAnalyze} />
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-foreground font-display text-lg">Analyzing your paper...</p>
            <p className="text-muted-foreground text-sm mt-1">This may take a moment</p>
          </div>
        )}

        {analysis && !loading && (
          <div className="space-y-6 animate-fade-in">
            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-accent rounded-xl">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "summary" && <SummarySection analysis={analysis} />}
            {activeTab === "insights" && <InsightsSection analysis={analysis} />}
            {activeTab === "charts" && <AnalysisCharts analysis={analysis} />}
            {activeTab === "qa" && paperText && <QASection paperText={paperText} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
