import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import type { AcquisitionChannel } from "@/hooks/useAcquisitionChannels";

/** Valor sintético usado pra filtrar leads sem canal cadastrado (channel_id nulo). */
export const NO_CHANNEL_VALUE = "__sem_canal__";

interface ChannelMultiSelectFilterProps {
  channels: AcquisitionChannel[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function ChannelMultiSelectFilter({ channels, selected, onChange }: ChannelMultiSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((s) => s !== value) : [...selected, value]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1 w-full sm:w-auto">
          Canais
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="max-h-64 overflow-y-auto space-y-1">
          {channels.map((c) => (
            <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer text-sm">
              <Checkbox checked={selected.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
              <span className="truncate">{c.name}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer text-sm border-t pt-2 mt-1">
            <Checkbox checked={selected.includes(NO_CHANNEL_VALUE)} onCheckedChange={() => toggle(NO_CHANNEL_VALUE)} />
            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-muted-foreground/30" />
            <span className="truncate text-muted-foreground">Sem canal</span>
          </label>
        </div>
        {selected.length > 0 && (
          <Button variant="ghost" size="sm" className="w-full mt-1 text-xs" onClick={() => onChange([])}>
            Limpar filtro
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
