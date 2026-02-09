import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useScopeItems, ScopeItem } from "@/hooks/useScopeItems";
import { ScopeItemForm } from "./ScopeItemForm";
import { cn } from "@/lib/utils";

interface ProjectScopeTabProps {
  projectId: string;
}

export function ProjectScopeTab({ projectId }: ProjectScopeTabProps) {
  const { items, isLoading, create, update, remove } = useScopeItems(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  const [scopeTypeFilter, setScopeTypeFilter] = useState<"projeto" | "contratado">("contratado");

  // Filter items by scope type
  const filteredItems = items.filter(i => 
    scopeTypeFilter === "projeto" || i.scope_type === "contratado"
  );

  const parentItems = filteredItems.filter((i) => !i.parent_id);
  const getChildren = (parentId: string) => filteredItems.filter((i) => i.parent_id === parentId);

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editingItem) {
      update.mutate({ id: editingItem.id as string, ...data });
    } else {
      create.mutate({ ...data, scope_type: scopeTypeFilter } as any);
    }
    setEditingItem(null);
  };

  const handleEdit = (item: ScopeItem) => {
    // Convert ScopeItem to Record<string, unknown> safely for the form
    const formItem: Record<string, unknown> = {
      id: item.id,
      discipline: item.discipline,
      description: item.description,
      suppliers_to_quote: item.suppliers_to_quote,
      payment_terms: item.payment_terms,
      entry_order: item.entry_order,
      service_duration: item.service_duration,
      parent_id: item.parent_id,
      estimated_value: item.estimated_value,
      scope_type: item.scope_type,
      activities: item.activities,
    };
    setEditingItem(formItem);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const renderRow = (item: ScopeItem, isChild = false) => (
    <TableRow key={item.id} className="hover:bg-muted/50">
      <TableCell className={cn("font-medium", isChild && "pl-10")}>{isChild ? "↳ " : ""}{item.discipline}</TableCell>
      <TableCell className="max-w-[200px]">
        <div className="text-sm text-muted-foreground truncate">{item.description || "—"}</div>
        {item.activities && (
          <div className="text-xs text-muted-foreground mt-1 bg-muted/50 p-1 rounded">
            {item.activities.split('\n').length} atividades
          </div>
        )}
      </TableCell>
      <TableCell className="text-sm">
        <Badge variant={item.scope_type === "contratado" ? "default" : "outline"}>
          {item.scope_type === "contratado" ? "Contratado" : "Projeto"}
        </Badge>
      </TableCell>
      <TableCell className="text-sm">{item.suppliers_to_quote || "—"}</TableCell>
      <TableCell className="text-sm">{item.payment_terms || "—"}</TableCell>
      <TableCell className="text-right">
        {item.estimated_value != null
          ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.estimated_value)
          : "—"}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(item)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove.mutate(item.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-display">Escopo da Obra</h3>
          <p className="text-sm text-muted-foreground">Definição das disciplinas e atividades</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
            <Button 
              size="sm" 
              variant={scopeTypeFilter === "projeto" ? "default" : "ghost"} 
              onClick={() => setScopeTypeFilter("projeto")}
              className="text-xs h-7"
            >
              Todos (Projeto)
            </Button>
            <Button 
              size="sm" 
              variant={scopeTypeFilter === "contratado" ? "default" : "ghost"} 
              onClick={() => setScopeTypeFilter("contratado")}
              className="text-xs h-7"
            >
              Apenas Contratado
            </Button>
          </div>
          <Button onClick={handleNew} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nova Disciplina
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          Nenhuma disciplina encontrada para o filtro selecionado.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Disciplina</TableHead>
                <TableHead>Descrição / Atividades</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fornecedores</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Valor Est.</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parentItems.map((item) => (
                <>
                  {renderRow(item)}
                  {getChildren(item.id).map((child) => renderRow(child, true))}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ScopeItemForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={editingItem}
        parentOptions={parentItems.map((i) => ({ id: i.id, discipline: i.discipline }))}
        isLoading={create.isPending || update.isPending}
      />
    </div>
  );
}
