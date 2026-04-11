import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Lightbulb, RefreshCw, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface Recommendation {
  title: string;
  reason: string;
  area: string;
}

export function PaperRecommendations({ hasAnalyses }: { hasAnalyses: boolean }) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("recommend-papers");
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setRecommendations(data.recommendations || []);
      setFetched(true);
    } catch (e: any) {
      toast.error(e.message || "Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (!hasAnalyses) return null;

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-display text-base text-foreground">AI Recommendations</h3>
        </div>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Lightbulb className="h-3.5 w-3.5" />
          )}
          {fetched ? "Refresh" : "Get Suggestions"}
        </button>
      </div>

      {!fetched && !loading && (
        <p className="text-sm text-muted-foreground">
          Get AI-powered paper recommendations based on your research history and keyword trends.
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-4 justify-center text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Analyzing your research patterns…
        </div>
      )}

      {fetched && !loading && recommendations.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No recommendations available. Try analyzing more papers first.
        </p>
      )}

      {!loading && recommendations.length > 0 && (
        <div className="grid gap-2">
          {recommendations.map((r, i) => (
            <div
              key={i}
              className="flex gap-3 p-3 rounded-lg bg-accent/50 border border-border hover:border-primary/30 transition-colors"
            >
              <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{r.reason}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                  {r.area}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
