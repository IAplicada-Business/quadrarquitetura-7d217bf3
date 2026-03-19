import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Upload, Sparkles, Plus, Loader2, FileUp } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const FOCUS_OPTIONS = [
  "Elétrica",
  "Hidráulica",
  "Luminotécnica",
  "Alvenaria",
  "Gesso/Forro",
  "Ar-condicionado",
  "Piso",
  "Revestimento",
  "Demolição",
  "Marcenaria",
  "Geral",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];

interface Activity {
  activity_name: string;
  environment: string;
  discipline: string;
  quantity: number;
  unit: string;
  estimated_days: number;
  selected: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: { id: string; name: string }[];
}

export function ImportPlantDialog({ open, onOpenChange, projects }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [projectId, setProjectId] = useState<string>("");
  const [focus, setFocus] = useState<string>("");
  const [instructions, setInstructions] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const reset = () => {
    setStep(1);
    setProjectId("");
    setFocus("");
    setInstructions("");
    setFile(null);
    setActivities([]);
    setIsAnalyzing(false);
    setIsCreating(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      toast({ title: "Arquivo muito grande", description: "Máximo 10MB", variant: "destructive" });
      return;
    }
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast({ title: "Formato inválido", description: "Aceito: PDF, PNG, JPG", variant: "destructive" });
      return;
    }
    setFile(f);
  };

  const handleAnalyze = async () => {
    if (!projectId || !focus || !file) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    setStep(2);
    setIsAnalyzing(true);

    try {
      // Upload file to storage
      const ext = file.name.split(".").pop();
      const path = `plants/${projectId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);
      const fileUrl = urlData.publicUrl;

      // Call edge function
      const { data, error } = await supabase.functions.invoke("analyze-plant", {
        body: { file_url: fileUrl, focus, instructions: instructions || undefined },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      const acts: Activity[] = (data.activities || []).map((a: any) => ({
        activity_name: a.activity_name || a.task_name || "",
        environment: a.environment || "",
        discipline: a.discipline || focus,
        quantity: Number(a.quantity) || 1,
        unit: a.unit || "un",
        estimated_days: Number(a.estimated_days) || 1,
        selected: true,
      }));

      setActivities(acts);

      // Save analysis history
      await supabase.from("plant_analyses" as any).insert({
        project_id: projectId,
        user_id: user!.id,
        file_url: fileUrl,
        focus,
        instructions: instructions || null,
        ai_result: data,
      });

      setStep(3);
    } catch (err: any) {
      console.error("Analyze error:", err);
      toast({ title: "Erro na análise", description: err.message, variant: "destructive" });
      setStep(1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleActivity = (idx: number) => {
    setActivities((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, selected: !a.selected } : a))
    );
  };

  const updateActivity = (idx: number, field: keyof Activity, value: string | number) => {
    setActivities((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a))
    );
  };

  const addBlankActivity = () => {
    setActivities((prev) => [
      ...prev,
      { activity_name: "", environment: "", discipline: focus, quantity: 1, unit: "un", estimated_days: 1, selected: true },
    ]);
  };

  const selectedCount = activities.filter((a) => a.selected).length;

  const handleCreateTasks = async () => {
    const selected = activities.filter((a) => a.selected && a.task_name.trim());
    if (selected.length === 0) {
      toast({ title: "Selecione ao menos uma atividade", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const rows = selected.map((a) => ({
        project_id: projectId,
        user_id: user!.id,
        task_name: a.task_name,
        environment: a.environment || null,
        discipline: a.discipline || null,
        estimated_days: a.estimated_days,
        status: "planejado",
        source: "planta_ia",
      }));

      const { error } = await supabase.from("schedule_tasks").insert(rows as any);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["all_schedule_tasks"] });
      toast({ title: `${selected.length} atividades criadas a partir da planta` });
      handleClose(false);
    } catch (err: any) {
      toast({ title: "Erro ao criar atividades", description: err.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={step === 3 ? "max-w-5xl max-h-[85vh] overflow-y-auto" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Importar Planta com IA
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Faça upload de uma planta e a IA gerará a lista de atividades automaticamente."}
            {step === 2 && "Analisando planta..."}
            {step === 3 && "Revise e edite as atividades antes de criar."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Projeto/Obra *</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Selecione o projeto" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Arquivo da planta *</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <FileUp className="h-5 w-5 text-primary" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-muted-foreground">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Clique para selecionar ou arraste o arquivo</p>
                    <p className="text-xs text-muted-foreground">PDF, PNG, JPG — máx 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Foco da análise *</Label>
              <Select value={focus} onValueChange={setFocus}>
                <SelectTrigger><SelectValue placeholder="Selecione o foco" /></SelectTrigger>
                <SelectContent>
                  {FOCUS_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Instruções adicionais</Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ex: Considerar 2 pontos de tomada por ambiente, incluir pontos de segurança..."
                rows={3}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleAnalyze}
              disabled={!projectId || !focus || !file}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Analisar com IA
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Analisando planta... isso pode levar alguns segundos</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">✓</TableHead>
                  <TableHead>Atividade</TableHead>
                  <TableHead>Ambiente</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead className="w-20">Qtd</TableHead>
                  <TableHead className="w-20">Unidade</TableHead>
                  <TableHead className="w-24">Prazo (dias)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((a, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Checkbox
                        checked={a.selected}
                        onCheckedChange={() => toggleActivity(idx)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={a.task_name}
                        onChange={(e) => updateActivity(idx, "task_name", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={a.environment}
                        onChange={(e) => updateActivity(idx, "environment", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={a.discipline}
                        onChange={(e) => updateActivity(idx, "discipline", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={a.quantity}
                        onChange={(e) => updateActivity(idx, "quantity", Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={a.unit}
                        onChange={(e) => updateActivity(idx, "unit", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={a.estimated_days}
                        onChange={(e) => updateActivity(idx, "estimated_days", Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Button variant="outline" size="sm" onClick={addBlankActivity}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar atividade
            </Button>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedCount} atividade{selectedCount !== 1 ? "s" : ""} selecionada{selectedCount !== 1 ? "s" : ""}
              </span>
              <Button onClick={handleCreateTasks} disabled={selectedCount === 0 || isCreating}>
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar atividades selecionadas
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
