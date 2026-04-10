import { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useContentPosts, STATUS_LABELS } from "@/hooks/useContentPosts";
import { useContentSeries } from "@/hooks/useContentSeries";
import ContentPostCard from "@/components/content/ContentPostCard";
import ContentPostSheet from "@/components/content/ContentPostSheet";
import type { ContentPost } from "@/hooks/useContentPosts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const COLUMNS = ["ideia", "roteiro", "gravando", "editando", "agendado", "publicado"] as const;

export default function ContentScripts() {
  const { posts, update, create } = useContentPosts();
  const { series } = useContentSeries();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);

  const seriesMap = Object.fromEntries(series.map((s) => [s.id, s]));

  const columns = COLUMNS.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    posts: posts.filter((p) => p.status === status),
  }));

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const postId = result.draggableId;
    const newStatus = result.destination.droppableId;
    update.mutate({ id: postId, status: newStatus });
  }, [update]);

  const handleEdit = (post: ContentPost) => {
    setSelectedPost(post);
    setSheetOpen(true);
  };

  const handleGenerateAI = async (post: ContentPost) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Não autenticado");

      toast({ title: "Gerando roteiro..." });
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/content-ai-assistant`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_script",
          objective: post.objective || post.title,
          type: post.type,
          platform: post.platform,
          target_audience: post.target_audience || "",
          tone: post.tone || "especialista",
        }),
      });
      if (!res.ok) throw new Error("Erro ao gerar");
      const result = await res.json();

      // Update post with AI results and open sheet
      const updatedPost = {
        ...post,
        hook: result.hook || post.hook,
        script: result.script || post.script,
        hashtags: result.hashtags || post.hashtags,
      };
      setSelectedPost(updatedPost);
      setSheetOpen(true);
      toast({ title: "Roteiro gerado!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleSave = (values: any) => {
    if (values.id) {
      update.mutate(values);
    } else {
      create.mutate(values);
    }
  };

  return (
    <div className="space-y-6 p-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-playfair">Roteiros</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie o fluxo de produção de conteúdo</p>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div key={col.status} className="flex-shrink-0 w-56">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-medium">{col.label}</h3>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2">{col.posts.length}</span>
              </div>
              <Droppable droppableId={col.status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${snapshot.isDraggingOver ? "bg-accent/30" : "bg-muted/30"}`}
                  >
                    {col.posts.map((post, index) => (
                      <Draggable key={post.id} draggableId={post.id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <ContentPostCard
                              post={post}
                              seriesColor={post.series_id ? seriesMap[post.series_id]?.color : undefined}
                              onEdit={handleEdit}
                              onGenerateAI={handleGenerateAI}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <ContentPostSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        post={selectedPost}
        series={series}
        onSave={handleSave}
      />
    </div>
  );
}
