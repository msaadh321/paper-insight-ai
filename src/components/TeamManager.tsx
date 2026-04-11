import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Users, Plus, Copy, LogIn as JoinIcon, Crown, Shield, User,
  Trash2, Share2, X, Loader2,
} from "lucide-react";
import type { PaperAnalysis } from "@/types/paper";

interface Team {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: { display_name: string | null; email: string | null; avatar_url: string | null };
}

interface SharedAnalysis {
  id: string;
  analysis_id: string;
  shared_by: string;
  shared_at: string;
  analysis?: {
    id: string;
    title: string;
    analysis: PaperAnalysis;
    created_at: string;
  };
  sharer_profile?: { display_name: string | null };
}

export function TeamManager() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [sharedAnalyses, setSharedAnalyses] = useState<SharedAnalysis[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [userAnalyses, setUserAnalyses] = useState<{ id: string; title: string }[]>([]);

  const fetchTeams = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id);

    if (data && data.length > 0) {
      const teamIds = data.map((d: any) => d.team_id);
      const { data: teamsData } = await supabase
        .from("teams")
        .select("*")
        .in("id", teamIds)
        .order("created_at", { ascending: false });
      setTeams((teamsData as any[]) || []);
    } else {
      setTeams([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const fetchTeamDetails = async (team: Team) => {
    setActiveTeam(team);
    // Fetch members with profiles
    const { data: membersData } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", team.id)
      .order("joined_at", { ascending: true });

    if (membersData) {
      const userIds = membersData.map((m: any) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, email, avatar_url")
        .in("id", userIds);

      const enriched = membersData.map((m: any) => ({
        ...m,
        profile: profiles?.find((p: any) => p.id === m.user_id) || null,
      }));
      setMembers(enriched);
    }

    // Fetch shared analyses
    const { data: shared } = await supabase
      .from("team_shared_analyses")
      .select("*")
      .eq("team_id", team.id)
      .order("shared_at", { ascending: false });

    if (shared && shared.length > 0) {
      const analysisIds = shared.map((s: any) => s.analysis_id);
      const sharerIds = shared.map((s: any) => s.shared_by);

      const [analysesRes, profilesRes] = await Promise.all([
        supabase.from("saved_analyses").select("id, title, analysis, created_at").in("id", analysisIds),
        supabase.from("profiles").select("id, display_name").in("id", [...new Set(sharerIds)]),
      ]);

      const enriched = shared.map((s: any) => ({
        ...s,
        analysis: analysesRes.data?.find((a: any) => a.id === s.analysis_id),
        sharer_profile: profilesRes.data?.find((p: any) => p.id === s.shared_by),
      }));
      setSharedAnalyses(enriched);
    } else {
      setSharedAnalyses([]);
    }
  };

  const handleCreateTeam = async () => {
    if (!user || !newTeamName.trim()) return;
    const { data, error } = await supabase
      .from("teams")
      .insert({ name: newTeamName.trim(), description: newTeamDesc.trim() || null, created_by: user.id })
      .select()
      .single();

    if (error) { toast.error("Failed to create team"); return; }

    // Add creator as owner
    await supabase.from("team_members").insert({
      team_id: (data as any).id,
      user_id: user.id,
      role: "owner",
    });

    toast.success("Team created!");
    setShowCreate(false);
    setNewTeamName("");
    setNewTeamDesc("");
    fetchTeams();
  };

  const handleJoinTeam = async () => {
    if (!user || !joinCode.trim()) return;
    const { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("invite_code", joinCode.trim())
      .maybeSingle();

    if (!team) { toast.error("Invalid invite code"); return; }

    const { error } = await supabase.from("team_members").insert({
      team_id: (team as any).id,
      user_id: user.id,
      role: "member",
    });

    if (error) {
      if (error.code === "23505") toast.error("You're already in this team");
      else toast.error("Failed to join team");
      return;
    }

    toast.success("Joined team!");
    setShowJoin(false);
    setJoinCode("");
    fetchTeams();
  };

  const handleShareAnalysis = async (analysisId: string) => {
    if (!user || !activeTeam) return;
    const { error } = await supabase.from("team_shared_analyses").insert({
      team_id: activeTeam.id,
      analysis_id: analysisId,
      shared_by: user.id,
    });

    if (error) {
      if (error.code === "23505") toast.error("Already shared");
      else toast.error("Failed to share");
      return;
    }

    toast.success("Analysis shared with team!");
    setShowShareModal(false);
    fetchTeamDetails(activeTeam);
  };

  const openShareModal = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_analyses")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setUserAnalyses((data as any[]) || []);
    setShowShareModal(true);
  };

  const handleLeaveTeam = async (teamId: string) => {
    if (!user) return;
    await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", user.id);
    toast.success("Left team");
    setActiveTeam(null);
    fetchTeams();
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Invite code copied!");
  };

  const roleIcon = (role: string) => {
    if (role === "owner") return <Crown className="h-3.5 w-3.5 text-primary" />;
    if (role === "admin") return <Shield className="h-3.5 w-3.5 text-primary/70" />;
    return <User className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Team detail view
  if (activeTeam) {
    const myRole = members.find(m => m.user_id === user?.id)?.role;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setActiveTeam(null)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to teams
          </button>
          <div className="flex gap-2">
            <button
              onClick={openShareModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" /> Share Paper
            </button>
            {myRole !== "owner" && (
              <button
                onClick={() => handleLeaveTeam(activeTeam.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                Leave Team
              </button>
            )}
          </div>
        </div>

        {/* Team Header */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg text-foreground">{activeTeam.name}</h3>
              {activeTeam.description && (
                <p className="text-sm text-muted-foreground mt-1">{activeTeam.description}</p>
              )}
            </div>
            <button
              onClick={() => copyInviteCode(activeTeam.invite_code)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Copy invite code"
            >
              <Copy className="h-3.5 w-3.5" />
              {activeTeam.invite_code}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Members */}
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Members ({members.length})
            </h4>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg bg-accent/50">
                  {m.profile?.avatar_url ? (
                    <img src={m.profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                      {(m.profile?.display_name || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {m.profile?.display_name || m.profile?.email || "Unknown"}
                    </p>
                  </div>
                  {roleIcon(m.role)}
                </div>
              ))}
            </div>
          </div>

          {/* Shared Analyses */}
          <div className="lg:col-span-2 glass-card rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-medium text-foreground">
              Shared Papers ({sharedAnalyses.length})
            </h4>
            {sharedAnalyses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No papers shared yet. Click "Share Paper" to contribute.
              </p>
            ) : (
              <div className="space-y-2">
                {sharedAnalyses.map((sa) => (
                  <div key={sa.id} className="p-3 rounded-lg bg-accent/50 border border-border hover:border-primary/30 transition-colors">
                    <p className="text-sm font-medium text-foreground">{sa.analysis?.title || "Untitled"}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Shared by {sa.sharer_profile?.display_name || "Unknown"}</span>
                      <span>{new Date(sa.shared_at).toLocaleDateString()}</span>
                      {(sa.analysis?.analysis as any)?.keywords?.length > 0 && (
                        <span>{(sa.analysis?.analysis as any).keywords.length} keywords</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
            <div className="bg-card border border-border rounded-xl p-5 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h4 className="font-display text-base text-foreground">Share Analysis</h4>
                <button onClick={() => setShowShareModal(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {userAnalyses.length === 0 ? (
                <p className="text-sm text-muted-foreground">You have no saved analyses to share.</p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {userAnalyses.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleShareAnalysis(a.id)}
                      className="w-full text-left p-3 rounded-lg text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      {a.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Teams list view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Your Teams
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoin(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent text-foreground hover:bg-accent/80 transition-colors"
          >
            <JoinIcon className="h-3.5 w-3.5" /> Join Team
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Create Team
          </button>
        </div>
      </div>

      {/* Create Team Form */}
      {showCreate && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Team name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newTeamDesc}
            onChange={(e) => setNewTeamDesc(e.target.value)}
            className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2">
            <button onClick={handleCreateTeam} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* Join Team Form */}
      {showJoin && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Enter invite code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleJoinTeam()}
          />
          <div className="flex gap-2">
            <button onClick={handleJoinTeam} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90">Join</button>
            <button onClick={() => setShowJoin(false)} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        </div>
      )}

      {/* Team Cards */}
      {teams.length === 0 && !showCreate && !showJoin ? (
        <div className="glass-card rounded-xl p-10 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium">No teams yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create a team or join one with an invite code.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {teams.map((t) => (
            <div
              key={t.id}
              onClick={() => fetchTeamDetails(t)}
              className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-colors"
            >
              <p className="text-sm font-medium text-foreground">{t.name}</p>
              {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
              <p className="text-xs text-muted-foreground mt-1">
                Created {new Date(t.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
