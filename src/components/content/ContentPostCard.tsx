import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { format } from "date-fns";
import { TYPE_COLORS, STATUS_LABELS } from "@/hooks/useContentPosts";
import type { ContentPost } from "@/hooks/useContentPosts";

interface ContentPostCardProps {
  post: ContentPost;
  seriesColor?: string;
  onEdit: (post: ContentPost) => void;
}

export default function ContentPostCard({ post, seriesColor, onEdit }: ContentPostCardProps) {
  return (
    <div
      className="bg-card border rounded-lg p-3 space-y-2 cursor-grab active:cursor-grabbing"
      style={{ borderLeftWidth: seriesColor ? 3 : 1, borderLeftColor: seriesColor || undefined }}
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge className="text-[10px] px-1.5 py-0 text-white" style={{ background: TYPE_COLORS[post.type] || "#666" }}>
          {post.type?.charAt(0).toUpperCase() + post.type?.slice(1)}
        </Badge>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {post.platform}
        </Badge>
      </div>

      <p className="text-sm font-medium leading-tight">{post.title}</p>

      {post.scheduled_date && (
        <p className="text-xs text-muted-foreground">
          {format(new Date(post.scheduled_date + "T12:00:00"), "dd/MM")}
        </p>
      )}

      {post.hook && (
        <p className="text-xs text-muted-foreground italic line-clamp-2">
          {post.hook.slice(0, 60)}{post.hook.length > 60 ? "..." : ""}
        </p>
      )}

      <div className="flex gap-1 pt-1">
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(post)}>
          <Pencil className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
