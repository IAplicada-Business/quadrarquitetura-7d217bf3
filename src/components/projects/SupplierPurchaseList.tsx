import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface PurchaseItem {
  name: string;
  supplier_name: string | null;
  value: number | null;
  specifications: string | null;
  status: string | null;
}

interface SupplierPurchaseListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PurchaseItem[];
}

export function SupplierPurchaseList({ open, onOpenChange, items }: SupplierPurchaseListProps) {
  const [copied, setCopied] = useState(false);

  const grouped = items.reduce<Record<string, PurchaseItem[]>>((acc, item) => {
    const supplier = item.supplier_name || "Sem Fornecedor";
    if (!acc[supplier]) acc[supplier] = [];
    acc[supplier].push(item);
    return acc;
  }, {});

  const generateText = () => {
    let text = "📋 LISTA DE COMPRAS POR FORNECEDOR\n\n";
    Object.entries(grouped).forEach(([supplier, items]) => {
      text += `🏪 ${supplier}\n`;
      items.forEach((item) => {
        text += `  • ${item.name}`;
        if (item.specifications) text += ` — ${item.specifications}`;
        if (item.value) text += ` — R$ ${item.value.toFixed(2)}`;
        text += "\n";
      });
      text += "\n";
    });
    return text;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateText());
    setCopied(true);
    toast({ title: "Lista copiada!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-display">Lista por Fornecedor</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {Object.entries(grouped).map(([supplier, items]) => (
            <div key={supplier} className="space-y-1">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Badge variant="outline">{supplier}</Badge>
                <span className="text-xs text-muted-foreground">({items.length})</span>
              </h4>
              <ul className="text-sm space-y-0.5 pl-4">
                {items.map((item, i) => (
                  <li key={i} className="text-muted-foreground">
                    • {item.name}
                    {item.specifications && <span className="text-xs"> — {item.specifications}</span>}
                    {item.value && <span className="font-medium text-foreground"> R$ {item.value.toFixed(2)}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Button onClick={handleCopy} className="w-full" variant="outline">
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copiado!" : "Copiar Lista"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
