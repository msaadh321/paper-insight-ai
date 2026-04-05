import { Clock, Trash2, FileText, Search } from "lucide-react";
import type { PaperAnalysis } from "@/types/paper";
import { useState } from "react";

interface SavedAnalysis {
  id: string;
  title: string;
  paper_text: string;
  analysis: PaperAnalysis;
  created_at: string;
}

interface AnalysisHistoryProps {
  analyses: SavedAnalysis[];
  onLoad: (a: SavedAnalysis) => void;
  onDelete: (id: string) => void;
  onNavigateToAnalyze: () => void;
}

export function AnalysisHistory({ analyses, onLoad, onDelete, onNavigateToAnalyze }: AnalysisHistoryProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "week" | "month">("all");

  const filtered = analyses.filter((a) => {
    const matchesSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "all") return true;
    const d = new Date(a.created_at);
    const now = new Date();
    if (filter === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return d >= monthAgo;
  });

  return (
    <div className="space-y-3">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search analyses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-accent border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "week", "month"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-10 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">
            {analyses.length === 0 ? "No saved analyses yet" : "No matching analyses"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {analyses.length === 0
              ? "Go to the analyzer, paste a paper, and save the results."
              : "Try adjusting your search or filter."}
          </p>
          {analyses.length === 0 && (
            <button onClick={onNavigateToAnalyze} className="mt-4 text-sm text-primary hover:underline font-medium">
              Start analyzing →
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((a) => (
            <div
              key={a.id}
              onClick={() => onLoad(a)}
              className="glass-card rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                  {a.analysis?.keywords?.length > 0 && (
                    <span>{a.analysis.keywords.length} keywords</span>
                  )}
                  {a.analysis?.entities?.length > 0 && (
                    <span>{a.analysis.entities.length} entities</span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(a.id); }}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
