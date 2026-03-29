import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { PaperAnalysis } from "@/types/paper";
import { toast } from "sonner";
import {
  GraduationCap,
  LogOut,
  ArrowLeft,
  Trash2,
  FileText,
  Clock,
  BarChart3,
  User,
  Loader2,
  BookOpen,
  Pencil,
  Check,
  X,
} from "lucide-react";

interface SavedAnalysis {
  id: string;
  title: string;
  paper_text: string;
  analysis: PaperAnalysis;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ display_name: string | null; email: string | null } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [analysesRes, profileRes] = await Promise.all([
        supabase
          .from("saved_analyses")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("display_name, email")
          .eq("id", user.id)
          .single(),
      ]);

      if (analysesRes.data) {
        setAnalyses(analysesRes.data as unknown as SavedAnalysis[]);
      }
      if (profileRes.data) {
        setProfile(profileRes.data);
      }
      setLoading(false);
    };

    fetchData();
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

  const handleLoadAnalysis = (a: SavedAnalysis) => {
    navigate("/", { state: { paperText: a.paper_text, analysis: a.analysis } });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalAnalyses = analyses.length;
  const totalKeywords = analyses.reduce(
    (sum, a) => sum + (a.analysis?.keywords?.length || 0),
    0
  );
  const latestDate = analyses.length
    ? new Date(analyses[0].created_at).toLocaleDateString()
    : "N/A";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-gold shadow-gold">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl text-foreground">Dashboard</h1>
              <p className="text-xs text-muted-foreground">Your research hub</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Analyze</span>
            </button>
            <ThemeToggle />
            <button
              onClick={() => { signOut(); toast.success("Signed out"); navigate("/auth"); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Card */}
        <section className="glass-card rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl text-foreground">
              {profile?.display_name || "Researcher"}
            </h2>
            <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: FileText, label: "Total Analyses", value: totalAnalyses },
            { icon: BarChart3, label: "Keywords Extracted", value: totalKeywords },
            { icon: Clock, label: "Last Analysis", value: latestDate },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-display text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Saved Analyses */}
        <section>
          <h3 className="font-display text-lg text-foreground flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            Saved Analyses
          </h3>

          {analyses.length === 0 ? (
            <div className="glass-card rounded-xl p-10 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">No saved analyses yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Go to the analyzer, paste a paper, and save the results.
              </p>
              <button
                onClick={() => navigate("/")}
                className="mt-4 text-sm text-primary hover:underline font-medium"
              >
                Start analyzing →
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {analyses.map((a) => (
                <div
                  key={a.id}
                  onClick={() => handleLoadAnalysis(a)}
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
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Climbart Tech. All rights reserved.</p>
          <p>ResearchLens v1.0.0 — AI-Powered Paper Analysis</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
