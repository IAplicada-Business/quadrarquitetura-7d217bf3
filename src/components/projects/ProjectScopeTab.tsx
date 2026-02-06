import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useScopeItems } from "@/hooks/useScopeItems";
import { ScopeItemForm } from "./ScopeItemForm";
import { cn } from "@/lib/utils";

interface ProjectScopeTabProps {
  projectId: string;
}

export function ProjectScopeTab({ projectId }: ProjectScopeTabProps) {
  const { items, isLoading, create, update, remove } = useScopeItems(projectId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);

  const parentItems = items.filter((i) => !i.parent_id);
  const getChildren = (parentId: string) => items.filter((i) => i.parent_id === parentId);

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editingItem) {
      update.mutate({ id: editingItem.id as string, ...data });
    } else {
      create.mutate(data as Parameters<typeof create.mutate>[0]);
    }
    setEditingItem(null);
  };

  const handleEdit = (item: Record<string, unknown>) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const renderRow = (item: typeof items[0], isChild = false) => (
    <TableRow key={item.id} className="hover:bg-muted/50">
      <TableCell className={cn("font-medium", isChild && "pl-10")}>{isChild ? "↳ " : ""}{item.discipline}</TableCell>
      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{item.description || "—"}</TableCell>
      <TableCell className="text-sm">{item.suppliers_to_quote || "—"}</TableCell>
      <TableCell className="text-sm">{item.payment_terms || "—"}</TableCell>
      <TableCell className="text-center text-sm">{item.entry_order ?? "—"}</TableCell>
      <TableCell className="text-sm">{item.service_duration || "—"}</TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(item as Record<string, unknown>)}>
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
          <p className="text-sm text-muted-foreground">{items.length} disciplina(s) cadastrada(s)</p>
        </div>
        <Button onClick={handleNew} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nova Disciplina
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          Nenhuma disciplina cadastrada. Clique em "Nova Disciplina" para começar.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Disciplina</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Fornecedores</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-center">Ordem</TableHead>
                <TableHead>Tempo</TableHead>
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
