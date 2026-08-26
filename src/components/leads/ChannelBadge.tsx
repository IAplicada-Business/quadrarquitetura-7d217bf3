import { Badge } from "@/components/ui/badge";
import type { AcquisitionChannel } from "@/hooks/useAcquisitionChannels";

interface ChannelBadgeProps {
  channel: Pick<AcquisitionChannel, "name" | "color"> | null | undefined;
  className?: string;
}

/** Badge colorido de canal de aquisição, usando a cor cadastrada pelo admin. */
export function ChannelBadge({ channel, className }: ChannelBadgeProps) {
  if (!channel) {
    return (
      <Badge variant="outline" className={`text-[10px] text-muted-foreground ${className ?? ""}`}>
        Sem canal
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={`text-[10px] gap-1 ${className ?? ""}`}
      style={{ borderColor: `${channel.color}55`, color: channel.color, background: `${channel.color}14` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: channel.color }} />
      {channel.name}
    </Badge>
  );
}
