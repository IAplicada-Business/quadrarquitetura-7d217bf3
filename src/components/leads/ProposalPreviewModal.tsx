import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PAGE_W, PAGE_H } from "./proposal-pages/shared";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: React.ReactElement[];
}

export function ProposalPreviewModal({ open, onOpenChange, pages }: Props) {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent(c => Math.max(0, c - 1));
  const next = () => setCurrent(c => Math.min(pages.length - 1, c + 1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden" style={{ width: "95vw", height: "95vh" }}>
        <div className="flex h-full">
          {/* Thumbnails */}
          <div className="w-32 bg-muted overflow-y-auto border-r flex-shrink-0 p-2 space-y-2">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-full rounded border-2 text-xs font-medium flex items-center justify-center transition-colors ${
                  i === current ? "border-primary bg-primary/10" : "border-transparent hover:border-muted-foreground/30"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Main view */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="text-sm font-medium">Página {current + 1} de {pages.length}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={prev} disabled={current === 0}><ChevronLeft className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" onClick={next} disabled={current === pages.length - 1}><ChevronRight className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/50 p-4">
              <div style={{ transform: "scale(0.55)", transformOrigin: "center center" }}>
                {pages[current]}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
