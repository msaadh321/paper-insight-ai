import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, Globe, FileText, Bell, Clock } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "comment" | "collection_shared" | "analysis_saved";
  title: string;
  subtitle: string;
  created_at: string;
}

interface RecentActivityFeedProps {
  className?: string;
}

export function RecentActivityFeed({ className }: RecentActivityFeedProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchActivity = async () => {
      const [commentsRes, collectionsRes, analysesRes] = await Promise.all([
        supabase
          .from("analysis_comments")
          .select("id, content, created_at, analysis_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("paper_collections")
          .select("id, name, is_public, created_at")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(10) as any,
        supabase
          .from("saved_analyses")
          .select("id, title, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const activity: ActivityItem[] = [];

      commentsRes.data?.forEach((c: any) => {
        activity.push({
          id: `comment-${c.id}`,
          type: "comment",
          title: "You commented",
          subtitle: c.content.slice(0, 60) + (c.content.length > 60 ? "…" : ""),
          created_at: c.created_at,
        });
      });

      collectionsRes.data?.forEach((c: any) => {
        activity.push({
          id: `collection-${c.id}`,
          type: "collection_shared",
          title: "Collection shared",
          subtitle: c.name,
          created_at: c.created_at,
        });
      });

      analysesRes.data?.forEach((a: any) => {
        activity.push({
          id: `analysis-${a.id}`,
          type: "analysis_saved",
          title: "Analysis saved",
          subtitle: a.title,
          created_at: a.created_at,
        });
      });

      activity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(activity.slice(0, 15));
      setLoading(false);
    };

    fetchActivity();
  }, [user]);

  const iconMap = {
    comment: { icon: MessageCircle, color: "text-blue-500 bg-blue-500/10" },
    collection_shared: { icon: Globe, color: "text-green-500 bg-green-500/10" },
    analysis_saved: { icon: FileText, color: "text-primary bg-primary/10" },
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (!user) return null;

  return (
    <div className={`glass-card rounded-xl p-5 ${className || ""}`}>
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-4 w-4 text-primary" />
        <h4 className="font-display text-sm text-foreground">Recent Activity</h4>
        {!loading && items.length > 0 && (
          <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary text-primary-foreground">
            {items.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-2.5 w-40 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No activity yet. Start analyzing papers!</p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => {
            const { icon: Icon, color } = iconMap[item.type];
            return (
              <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                <div className={`p-1.5 rounded-lg shrink-0 ${color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                  {timeAgo(item.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Small badge showing unread count for use in navigation */
export function useActivityCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [comments, collections] = await Promise.all([
        supabase.from("analysis_comments").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", oneDayAgo),
        supabase.from("paper_collections").select("id", { count: "exact", head: true }).eq("is_public", true).gte("created_at", oneDayAgo) as any,
      ]);
      setCount((comments.count || 0) + (collections.count || 0));
    };
    fetchCount();
  }, [user]);

  return count;
}
