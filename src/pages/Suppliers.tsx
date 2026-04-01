import { useState } from "react";
import { Plus, Pencil, Trash2, Calendar, MapPin, Users, Phone, Truck, FileText } from "lucide-react";
import { SupplierDetailSheet } from "@/components/construction/SupplierDetailSheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { handleDeleteError } from "@/lib/handleDeleteError";

const CATEGORIES = [
  "Pedreiro", "Eletricista", "Encanador", "Marcenaria", "Pintura", "Vidraceiro", "Serralheria", "Marmoraria", "Gesso", "Outros"
];

export default function Suppliers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("suppliers").insert({ ...data, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setFormOpen(false);
      toast({ title: "Fornecedor criado" });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase.from("suppliers").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setFormOpen(false);
      toast({ title: "Fornecedor atualizado" });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Fornecedor removido" });
    },
    onError: (error: any) => handleDeleteError(error, "suppliers"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);
    
    if (editing) {
      update.mutate({ id: editing.id, ...data });
    } else {
      create.mutate(data);
    }
  };

  const filtered = suppliers.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.contact?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-display">Fornecedores</h1>
          <p className="text-muted-foreground">Gestão de parceiros e prestadores de serviço</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Novo Fornecedor
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Input 
          placeholder="Buscar fornecedor..." 
          className="max-w-sm" 
          value={searchTerm}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <Card key={s.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedSupplier(s)}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{s.name}</CardTitle>
                  <Badge variant="secondary">{s.category}</Badge>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(s); setFormOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove.mutate(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {s.contact && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" /> {s.contact}
                </div>
              )}
              {s.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" /> {s.phone}
                </div>
              )}
              {s.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs">✉️</span> {s.email}
                </div>
              )}
              {s.payment_conditions && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" /> Pgto: {s.payment_conditions}
                </div>
              )}
              {s.rating && (
                <div className="flex items-center gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-lg ${i < s.rating ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label>Nome da Empresa/Profissional</Label>
              <Input name="name" defaultValue={editing?.name} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select name="category" defaultValue={editing?.category || "Outros"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Contato Principal</Label>
                <Input name="contact" defaultValue={editing?.contact} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Telefone</Label>
                <Input name="phone" defaultValue={editing?.phone} />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input name="email" defaultValue={editing?.email} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Chave Pix / Dados Bancários</Label>
              <Input name="pix_key" defaultValue={editing?.pix_key} />
            </div>
            <div className="grid gap-2">
              <Label>Condições de Pagamento Padrão</Label>
              <Input name="payment_conditions" defaultValue={editing?.payment_conditions} placeholder="Ex: 50% entrada + 50% entrega" />
            </div>
            <div className="grid gap-2">
              <Label>Avaliação (1-5)</Label>
              <Input type="number" min="1" max="5" name="rating" defaultValue={editing?.rating} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
