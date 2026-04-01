import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MessageCircle, Send, Trash2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profile?: { display_name: string | null; email: string | null };
}

interface AnalysisCommentsProps {
  analysisId: string;
}

export function AnalysisComments({ analysisId }: AnalysisCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`comments-${analysisId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "analysis_comments",
        filter: `analysis_id=eq.${analysisId}`,
      }, (payload) => {
        const newComment = payload.new as Comment;
        setComments((prev) => {
          if (prev.some((c) => c.id === newComment.id)) return prev;
          return [...prev, newComment];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [analysisId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("analysis_comments")
      .select("*")
      .eq("analysis_id", analysisId)
      .order("created_at", { ascending: true }) as any;
    if (data) setComments(data);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!user || !input.trim()) return;
    setSending(true);
    const { error } = await supabase.from("analysis_comments").insert({
      analysis_id: analysisId,
      user_id: user.id,
      content: input.trim(),
    } as any);
    if (error) toast.error("Failed to post comment");
    else setInput("");
    setSending(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("analysis_comments").delete().eq("id", id) as any;
    if (error) toast.error("Failed to delete");
    else setComments((prev) => prev.filter((c) => c.id !== id));
  };

  if (!user) return null;

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <h3 className="font-display text-lg text-foreground flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        Discussion ({comments.length})
      </h3>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Start the discussion!
        </p>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 group">
              <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {(c.profile?.display_name || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {c.profile?.display_name || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{c.content}</p>
              </div>
              {c.user_id === user.id && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-accent border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
        />
        <Button size="sm" onClick={handleSend} disabled={!input.trim() || sending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
