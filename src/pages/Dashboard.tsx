import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AvatarUpload } from "@/components/AvatarUpload";
import { CollectionsManager } from "@/components/CollectionsManager";
import { DashboardStats } from "@/components/DashboardStats";
import { ActivityCharts } from "@/components/ActivityCharts";
import { AnalysisHistory } from "@/components/AnalysisHistory";
import { RecentActivityFeed, useActivityCount } from "@/components/RecentActivityFeed";
import type { PaperAnalysis } from "@/types/paper";
import { toast } from "sonner";
import {
  GraduationCap, LogOut, ArrowLeft, Loader2, Pencil, Check, X, Plus, Bell,
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
  const [profile, setProfile] = useState<{ display_name: string | null; email: string | null; avatar_url: string | null } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [activeSection, setActiveSection] = useState<"overview" | "history" | "collections" | "activity">("overview");
  const activityCount = useActivityCount();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [analysesRes, profileRes] = await Promise.all([
        supabase.from("saved_analyses").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("display_name, email, avatar_url").eq("id", user.id).single() as any,
      ]);
      if (analysesRes.data) setAnalyses(analysesRes.data as unknown as SavedAnalysis[]);
      if (profileRes.data) setProfile(profileRes.data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("saved_analyses").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else {
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Analysis deleted");
    }
  };

  const handleSaveName = async () => {
    if (!user || !newName.trim()) return;
    const { error } = await supabase.from("profiles").update({ display_name: newName.trim() }).eq("id", user.id);
    if (error) toast.error("Failed to update name");
    else {
      setProfile((prev) => prev ? { ...prev, display_name: newName.trim() } : prev);
      toast.success("Display name updated!");
      setEditingName(false);
    }
  };

  const handleLoadAnalysis = (a: SavedAnalysis) => {
    navigate("/", { state: { paperText: a.paper_text, analysis: a.analysis, analysisId: a.id } });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sections = [
    { key: "overview" as const, label: "Overview", badge: 0 },
    { key: "history" as const, label: "History", badge: analyses.length },
    { key: "collections" as const, label: "Collections", badge: 0 },
    { key: "activity" as const, label: "Activity", badge: activityCount },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl gradient-gold shadow-gold">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-lg text-foreground">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Analysis</span>
            </button>
            {/* Notification bell */}
            <button
              onClick={() => setActiveSection("activity")}
              className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bell className="h-4 w-4" />
              {activityCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold bg-destructive text-destructive-foreground">
                  {activityCount > 99 ? "99+" : activityCount}
                </span>
              )}
            </button>
            <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <ThemeToggle />
            <button onClick={() => { signOut(); toast.success("Signed out"); navigate("/auth"); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <section className="glass-card rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <AvatarUpload
            avatarUrl={profile?.avatar_url || null}
            displayName={profile?.display_name || null}
            onUpload={(url) => setProfile((p) => p ? { ...p, avatar_url: url } : p)}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-accent border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") setEditingName(false);
                    }}
                  />
                  <button onClick={handleSaveName} className="p-1 text-primary hover:text-primary/80"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditingName(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-xl text-foreground">{profile?.display_name || "Researcher"}</h2>
                  <button onClick={() => { setNewName(profile?.display_name || ""); setEditingName(true); }} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
            </p>
          </div>
        </section>

        {/* Section Tabs */}
        <div className="flex gap-1 bg-accent/50 rounded-lg p-1 w-fit flex-wrap">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`relative px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeSection === s.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
              {s.badge > 0 && activeSection !== s.key && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-destructive text-destructive-foreground">
                  {s.badge > 99 ? "99+" : s.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            <DashboardStats analyses={analyses} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ActivityCharts analyses={analyses} />
              </div>
              <RecentActivityFeed />
            </div>
          </div>
        )}

        {/* History */}
        {activeSection === "history" && (
          <AnalysisHistory
            analyses={analyses}
            onLoad={handleLoadAnalysis}
            onDelete={handleDelete}
            onNavigateToAnalyze={() => navigate("/")}
          />
        )}

        {/* Collections */}
        {activeSection === "collections" && <CollectionsManager />}

        {/* Activity */}
        {activeSection === "activity" && (
          <RecentActivityFeed className="max-w-2xl" />
        )}
      </main>

      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Climbart Tech. All rights reserved.</p>
          <p>ResearchLens v2.0.0 — AI-Powered Paper Analysis</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
