import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calculator, ChevronDown, Save, PlusCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  useCostReferenceTable,
  CONSTRUCTION_TYPE_LABELS,
  FINISH_LEVEL_LABELS,
  FINISH_LEVEL_MAP,
  type ConstructionType,
  type FinishLevel,
} from "@/hooks/useCostReferenceTable";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

interface BudgetEstimatorProps {
  project: Record<string, unknown>;
  updateProject: { mutateAsync: (updates: Record<string, unknown>) => Promise<void>; isPending?: boolean };
  onTabChange?: (tab: string) => void;
}

export function BudgetEstimator({ project, updateProject, onTabChange }: BudgetEstimatorProps) {
  const { costTable, isLoading } = useCostReferenceTable();

  const [area, setArea] = useState<number>((project.area_sqm as number) || 0);
  const [constructionType, setConstructionType] = useState<ConstructionType | "">(
    (project.construction_type_estimate as ConstructionType) || ""
  );
  const [finishLevel, setFinishLevel] = useState<FinishLevel | "">(
    FINISH_LEVEL_MAP[(project.finish_level as number)] || ""
  );
  const [costPerSqm, setCostPerSqm] = useState<number>(0);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [numRooms, setNumRooms] = useState<number | "">("");

  // Auto-fill cost per m² from reference table
  useEffect(() => {
    if (!isManualOverride && constructionType && finishLevel && costTable[constructionType]) {
      setCostPerSqm(costTable[constructionType][finishLevel] || 0);
    }
  }, [constructionType, finishLevel, costTable, isManualOverride]);

  const estimated = useMemo(() => area * costPerSqm, [area, costPerSqm]);
  const rangeLow = useMemo(() => estimated * 0.85, [estimated]);
  const rangeHigh = useMemo(() => estimated * 1.15, [estimated]);
  const hasResult = area > 0 && costPerSqm > 0;

  const persistFields = async (overrides: Record<string, unknown> = {}) => {
    const updates: Record<string, unknown> = {};
    if (area !== (project.area_sqm as number)) updates.area_sqm = area;
    if (constructionType !== (project.construction_type_estimate as string)) updates.construction_type_estimate = constructionType;
    const currentFinishInt = Object.entries(FINISH_LEVEL_MAP).find(([, v]) => v === finishLevel)?.[0];
    if (currentFinishInt && Number(currentFinishInt) !== (project.finish_level as number)) updates.finish_level = Number(currentFinishInt);
    Object.assign(updates, overrides);
    if (Object.keys(updates).length > 0) {
      await updateProject.mutateAsync(updates);
    }
  };

  const handleSaveEstimate = async () => {
    if (!hasResult) return;
    await persistFields({ estimated_budget: Math.round(estimated) });
    toast({ title: "Orçamento estimado salvo no projeto" });
  };

  const handleCreateScenario = async () => {
    if (!hasResult) return;
    await persistFields();
    onTabChange?.("cenarios");
  };

  if (isLoading) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold font-display flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Estimativa Rápida de Orçamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Área total (m²)</Label>
            <Input
              type="number"
              min={0}
              value={area || ""}
              onChange={(e) => setArea(Number(e.target.value))}
              onBlur={() => persistFields()}
              placeholder="Ex: 150"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tipo de obra</Label>
            <Select
              value={constructionType}
              onValueChange={(v) => {
                setConstructionType(v as ConstructionType);
                setIsManualOverride(false);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {Object.entries(CONSTRUCTION_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nível de acabamento</Label>
            <Select
              value={finishLevel}
              onValueChange={(v) => {
                setFinishLevel(v as FinishLevel);
                setIsManualOverride(false);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {Object.entries(FINISH_LEVEL_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Valor por m² (R$)</Label>
            <Input
              type="number"
              min={0}
              value={costPerSqm || ""}
              onChange={(e) => {
                setCostPerSqm(Number(e.target.value));
                setIsManualOverride(true);
              }}
              placeholder="Auto"
            />
          </div>
        </div>

        {/* Result */}
        {hasResult && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-5 space-y-2">
            <p className="text-sm text-muted-foreground">Orçamento estimado</p>
            <p className="text-3xl font-bold text-primary font-display">{formatCurrency(estimated)}</p>
            <p className="text-sm text-muted-foreground">
              Faixa estimada: <span className="font-medium text-foreground">{formatCurrency(rangeLow)}</span> até{" "}
              <span className="font-medium text-foreground">{formatCurrency(rangeHigh)}</span>
            </p>
            <div className="flex gap-3 pt-3">
              <Button size="sm" onClick={handleSaveEstimate} disabled={updateProject.isPending}>
                <Save className="h-4 w-4 mr-1.5" />
                Salvar como orçamento estimado
              </Button>
              <Button size="sm" variant="outline" onClick={handleCreateScenario} disabled={updateProject.isPending}>
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Criar cotação a partir desta estimativa
              </Button>
            </div>
          </div>
        )}

        {/* Collapsible detail */}
        <Collapsible open={detailOpen} onOpenChange={setDetailOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 px-0">
              <ChevronDown className={`h-4 w-4 transition-transform ${detailOpen ? "rotate-180" : ""}`} />
              Detalhamento
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nº de ambientes</Label>
                <Input
                  type="number"
                  min={0}
                  value={numRooms}
                  onChange={(e) => setNumRooms(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Ex: 8"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Metragem principal (m²)</Label>
                <Input type="number" min={0} placeholder="Cozinha, suíte..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Metragem secundária (m²)</Label>
                <Input type="number" min={0} placeholder="Banheiros, lavabo..." />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Campos opcionais para referência futura.</p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
