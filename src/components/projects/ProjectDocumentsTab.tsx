import { useState } from "react";
import { Plus, Pencil, Trash2, Upload, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = ["planta", "contrato", "laudo", "proposta", "relatorio", "orcamento"];
const categoryLabels: Record<string, string> = {
  planta: "Planta",
  contrato: "Contrato",
  laudo: "Laudo",
  proposta: "Proposta",
  relatorio: "Relatório",
  orcamento: "Orçamento",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectDocumentsTab({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", projectId] });
      toast({ title: "Documento removido" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !user) return;
    setUploading(true);

    try {
      let fileUrl: string | null = null;
      let fileSize: number | null = null;

      if (file) {
        const filePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("project-files")
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(filePath);
        fileUrl = urlData.publicUrl;
        fileSize = file.size;
      }

      const insertData: {
        name: string;
        category?: "planta" | "contrato" | "laudo" | "proposta" | "relatorio" | "orcamento";
        file_url?: string | null;
        file_size?: number | null;
        project_id: string;
        user_id: string;
      } = {
        name,
        project_id: projectId,
        user_id: user.id,
      };
      if (category && CATEGORIES.includes(category)) {
        insertData.category = category as "planta" | "contrato" | "laudo" | "proposta" | "relatorio" | "orcamento";
      }
      if (fileUrl) insertData.file_url = fileUrl;
      if (fileSize) insertData.file_size = fileSize;

      const { error } = await supabase.from("documents").insert(insertData);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["documents", projectId] });
      toast({ title: "Documento adicionado" });
      setFormOpen(false);
      setName(""); setCategory(""); setFile(null);
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-display">Documentos do Projeto</h3>
          <p className="text-sm text-muted-foreground">{documents.length} documentos</p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Upload className="h-4 w-4 mr-1" /> Upload
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          Nenhum documento cadastrado.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {doc.name}
                </TableCell>
                <TableCell>
                  {doc.category ? (
                    <Badge variant="outline">{categoryLabels[doc.category] || doc.category}</Badge>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatFileSize(doc.file_size)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(doc.created_at)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {doc.file_url && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeMutation.mutate(doc.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-display">Upload de Documento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label>Nome do Documento</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome..." required />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Arquivo</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={uploading}>{uploading ? "Enviando..." : "Upload"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
