import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Trash2, Loader2 } from "lucide-react";
import type { PaperAnalysis } from "@/types/paper";
import { toast } from "sonner";

interface SavedAnalysis {
  id: string;
  title: string;
  paper_text: string;
  analysis: PaperAnalysis;
  created_at: string;
}

interface SavedAnalysesProps {
  onLoad: (paperText: string, analysis: PaperAnalysis) => void;
}

export function SavedAnalyses({ onLoad }: SavedAnalysesProps) {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalyses = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("saved_analyses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load saved analyses");
    } else {
      setAnalyses((data as unknown as SavedAnalysis[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalyses();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_analyses").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Analysis deleted");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (analyses.length === 0) return null;

  return (
    <div className="space-y-3 mt-6">
      <h3 className="font-display text-lg text-foreground flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        Saved Analyses
      </h3>
      <div className="grid gap-2">
        {analyses.map((a) => (
          <div
            key={a.id}
            className="glass-card rounded-lg p-3 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => onLoad(a.paper_text, a.analysis)}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(a.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
              className="p-1.5 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
