import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, Plus, X } from "lucide-react";

interface Props {
  categories: string[];
  onSave: (categories: string[]) => void;
  isPending?: boolean;
}

export default function SupplierCategoriesManager({ categories, onSave, isPending }: Props) {
  const [items, setItems] = useState<string[]>(categories);
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed || items.includes(trimmed)) return;
    const updated = [...items, trimmed];
    setItems(updated);
    setNewItem("");
    onSave(updated);
  };

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    onSave(updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Categorias de Fornecedores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Nova categoria..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            className="flex-1"
          />
          <Button size="sm" onClick={addItem} disabled={isPending || !newItem.trim()}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((cat, i) => (
            <Badge key={i} variant="secondary" className="text-sm py-1 px-3 gap-1.5">
              {cat}
              <button onClick={() => removeItem(i)} className="hover:text-destructive transition-colors">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
