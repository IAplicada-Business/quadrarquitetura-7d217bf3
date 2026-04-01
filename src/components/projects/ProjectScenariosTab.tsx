import { useState } from "react";
import { Plus, Trash2, Check, DollarSign, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useScenarios, Scenario } from "@/hooks/useScenarios";
import { useProjectDetail } from "@/hooks/useProjectDetail";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useScenarios, Scenario } from "@/hooks/useScenarios";
import { useProjectDetail } from "@/hooks/useProjectDetail";

function formatCurrency(v: number | null | undefined) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

const finishLevels = [
  { value: 1, label: "Básico" },
  { value: 2, label: "Intermediário" },
  { value: 3, label: "Alto Padrão" },
];

interface ProjectScenariosTabProps {
  projectId: string;
}

export function ProjectScenariosTab({ projectId }: ProjectScenariosTabProps) {
  const { project, updateProject } = useProjectDetail(projectId);
  const { scenarios, isLoading, createScenario, removeScenario, addItem, updateItem, removeItem, approveScenario } = useScenarios(projectId);

  const [newScenarioName, setNewScenarioName] = useState("");
  const [addItemOpen, setAddItemOpen] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ discipline: "", description: "", estimated_value: "" });
  const [budgetInput, setBudgetInput] = useState((project as any)?.client_budget?.toString() || "");
  const [confirmApproveScenario, setConfirmApproveScenario] = useState<Scenario | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ analysis_text: string; items: any[] } | null>(null);

  const handleCreateScenario = () => {
    if (!newScenarioName.trim()) return;
    createScenario.mutate(newScenarioName.trim());
    setNewScenarioName("");
  };

  const handleAddItem = (scenarioId: string) => {
    if (!newItem.discipline.trim()) return;
    addItem.mutate({
      scenario_id: scenarioId,
      discipline: newItem.discipline,
      description: newItem.description || undefined,
      estimated_value: newItem.estimated_value ? Number(newItem.estimated_value) : 0,
    });
    setNewItem({ discipline: "", description: "", estimated_value: "" });
    setAddItemOpen(null);
  };

  const handleSaveBudget = () => {
    const val = budgetInput ? Number(budgetInput) : null;
    updateProject.mutate({ client_budget: val });
  };

  const handleApproveClick = (scenario: Scenario) => {
    const hasApproved = scenarios.some((s) => s.is_approved);
    if (hasApproved) {
      setConfirmApproveScenario(scenario);
    } else {
      approveScenario.mutate(scenario);
    }
  };

  const handleConfirmApprove = () => {
    if (confirmApproveScenario) {
      approveScenario.mutate(confirmApproveScenario);
      setConfirmApproveScenario(null);
    }
  };

  const clientBudget = (project as any)?.client_budget as number | null;
  const projectData = project as any;

  const handleAnalyzeBudget = async () => {
    const approvedScenario = scenarios.find(s => s.is_approved);
    if (!approvedScenario) { toast.error("Aprove um cenário antes de analisar"); return; }
    setAnalysisLoading(true);
    setAnalysisOpen(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const { data: priceData } = await supabase.from("price_research").select("*").eq("project_id", projectId);
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/project-ai-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          action: "analyze_budget",
          data: {
            scenario_items: approvedScenario.scenario_items || [],
            price_research: priceData || [],
          },
        }),
      });
      if (!resp.ok) throw new Error("Erro ao analisar orçamento");
      const result = await resp.json();
      setAnalysisResult(result);
    } catch (err: any) {
      toast.error(err.message || "Erro na análise");
      setAnalysisOpen(false);
    } finally {
      setAnalysisLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Project Context */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Contexto do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs">Orçamento do Cliente</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  placeholder="R$"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="h-8 text-sm"
                />
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleSaveBudget} disabled={updateProject.isPending}>OK</Button>
              </div>
              {clientBudget != null && <span className="text-xs font-semibold text-primary">{formatCurrency(clientBudget)}</span>}
            </div>
            <div>
              <Label className="text-xs">Nível de Acabamento</Label>
              <Select
                value={String(projectData?.finish_level || "")}
                onValueChange={(v) => updateProject.mutate({ finish_level: Number(v) })}
              >
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {finishLevels.map(fl => (
                    <SelectItem key={fl.value} value={String(fl.value)}>{fl.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Área (m²)</Label>
              <p className="text-sm font-medium mt-2">{projectData?.area_sqm ? `${projectData.area_sqm} m²` : "—"}</p>
            </div>
            <div>
              <Label className="text-xs">Tipo de Obra</Label>
              <p className="text-sm font-medium mt-2 capitalize">{projectData?.project_type || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Scenario */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Nome da cotação (ex: Cotação A)"
          value={newScenarioName}
          onChange={(e) => setNewScenarioName(e.target.value)}
          className="max-w-[300px]"
          onKeyDown={(e) => e.key === "Enter" && handleCreateScenario()}
        />
        <Button onClick={handleCreateScenario} disabled={!newScenarioName.trim() || createScenario.isPending}>
          <Plus className="h-4 w-4 mr-1" /> Nova Cotação
        </Button>
      </div>

      {/* Scenarios */}
      {scenarios.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          Nenhuma cotação criada. Crie uma cotação para começar a simulação.
        </div>
      ) : (
        <div className={scenarios.length >= 2 ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "space-y-4"}>
          {scenarios.map((scenario) => {
            const items = scenario.scenario_items || [];
            const totalIncluded = items.filter((i) => i.is_included).reduce((sum, i) => sum + (i.estimated_value || 0), 0);
            const totalAll = items.reduce((sum, i) => sum + (i.estimated_value || 0), 0);
            const overBudget = clientBudget != null && totalIncluded > clientBudget;

            return (
              <Card key={scenario.id} className={scenario.is_approved ? "border-green-500 border-2" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{scenario.name}</CardTitle>
                      {scenario.is_approved && <Badge variant="default" className="text-xs bg-green-600">Aprovado</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      {!scenario.is_approved && (
                        <Button size="sm" variant="default" onClick={() => handleApproveClick(scenario)} disabled={approveScenario.isPending}>
                          <Check className="h-3 w-3 mr-1" /> Aprovar
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeScenario.mutate(scenario.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-4 text-sm flex-wrap">
                    <span>Incluído: <strong className={overBudget ? "text-destructive" : "text-green-600"}>{formatCurrency(totalIncluded)}</strong></span>
                    <span>Total: <strong>{formatCurrency(totalAll)}</strong></span>
                    {clientBudget != null && (
                      <span className={overBudget ? "text-destructive" : "text-muted-foreground"}>
                        {overBudget
                          ? `⚠️ +${formatCurrency(totalIncluded - clientBudget)}`
                          : `✅ -${formatCurrency(clientBudget - totalIncluded)}`}
                      </span>
                    )}
                  </div>

                  {items.length > 0 && (
                    <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                          <Checkbox
                            checked={item.is_included}
                            onCheckedChange={(checked) => updateItem.mutate({ id: item.id, is_included: !!checked })}
                          />
                          <span className={`flex-1 ${!item.is_included ? "line-through text-muted-foreground" : ""}`}>
                            {item.discipline}
                            {item.description && <span className="text-muted-foreground ml-1 text-xs">— {item.description}</span>}
                          </span>
                          <Input
                            type="number"
                            className="w-28 h-7 text-xs"
                            value={item.estimated_value || ""}
                            onChange={(e) => updateItem.mutate({ id: item.id, estimated_value: Number(e.target.value) || 0 })}
                          />
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeItem.mutate(item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button size="sm" variant="outline" onClick={() => { setAddItemOpen(scenario.id); setNewItem({ discipline: "", description: "", estimated_value: "" }); }}>
                    <Plus className="h-3 w-3 mr-1" /> Adicionar Disciplina
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={!!addItemOpen} onOpenChange={() => setAddItemOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Disciplina</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Disciplina *</Label>
              <Input value={newItem.discipline} onChange={(e) => setNewItem({ ...newItem, discipline: e.target.value })} placeholder="Ex: Elétrica" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor Estimado (R$)</Label>
              <Input type="number" value={newItem.estimated_value} onChange={(e) => setNewItem({ ...newItem, estimated_value: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddItemOpen(null)}>Cancelar</Button>
              <Button onClick={() => addItemOpen && handleAddItem(addItemOpen)} disabled={!newItem.discipline.trim()}>Adicionar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Approve Dialog */}
      <AlertDialog open={!!confirmApproveScenario} onOpenChange={(open) => { if (!open) setConfirmApproveScenario(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir cenário aprovado?</AlertDialogTitle>
            <AlertDialogDescription>
              Já existe um cenário aprovado. Aprovar este novo cenário substituirá o escopo atual. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmApprove}>Sim, aprovar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
