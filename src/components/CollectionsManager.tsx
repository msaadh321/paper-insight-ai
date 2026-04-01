import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  FolderOpen, Plus, Trash2, Share2, Globe, Lock, Copy, Check, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  share_token: string;
  is_public: boolean;
  created_at: string;
  paper_count?: number;
}

interface CollectionsManagerProps {
  analysisId?: string;
}

export function CollectionsManager({ analysisId }: CollectionsManagerProps) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchCollections();
  }, [user]);

  const fetchCollections = async () => {
    const { data } = await supabase
      .from("paper_collections")
      .select("*")
      .order("created_at", { ascending: false }) as any;
    if (data) setCollections(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("paper_collections").insert({
      user_id: user.id,
      name: name.trim(),
      description: desc.trim() || null,
    } as any);
    if (error) {
      toast.error("Failed to create collection");
    } else {
      toast.success("Collection created!");
      setName("");
      setDesc("");
      setDialogOpen(false);
      fetchCollections();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("paper_collections").delete().eq("id", id) as any;
    if (error) toast.error("Failed to delete");
    else {
      setCollections((p) => p.filter((c) => c.id !== id));
      toast.success("Collection deleted");
    }
  };

  const handleTogglePublic = async (c: Collection) => {
    const { error } = await supabase
      .from("paper_collections")
      .update({ is_public: !c.is_public } as any)
      .eq("id", c.id) as any;
    if (error) toast.error("Failed to update");
    else {
      setCollections((p) => p.map((x) => x.id === c.id ? { ...x, is_public: !x.is_public } : x));
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    if (!analysisId) return;
    const { error } = await supabase.from("collection_papers").insert({
      collection_id: collectionId,
      analysis_id: analysisId,
    } as any);
    if (error) {
      if (error.code === "23505") toast.info("Already in this collection");
      else toast.error("Failed to add");
    } else {
      toast.success("Added to collection!");
    }
  };

  const copyShareLink = (token: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/shared/${token}`);
    setCopiedId(id);
    toast.success("Share link copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-foreground flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          Collections
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-4 w-4" /> New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <input
                placeholder="Collection name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <textarea
                placeholder="Description (optional)"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                className="w-full bg-accent border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <Button onClick={handleCreate} disabled={!name.trim()} className="w-full">
                Create Collection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : collections.length === 0 ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No collections yet. Create one to organize your papers.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {collections.map((c) => (
            <div
              key={c.id}
              className="glass-card rounded-xl p-4 flex items-center justify-between group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  {c.is_public ? (
                    <Globe className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                </div>
                {c.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{c.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {analysisId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddToCollection(c.id)}
                    className="text-xs h-7 px-2"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                )}
                <button
                  onClick={() => handleTogglePublic(c)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                  title={c.is_public ? "Make private" : "Make public"}
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => copyShareLink(c.share_token, c.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                  title="Copy share link"
                >
                  {copiedId === c.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
