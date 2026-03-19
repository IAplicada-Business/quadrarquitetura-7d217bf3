import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, User, Palette, Calculator, Tag, MessageSquare, Save } from "lucide-react";
import CalculationRulesTab from "@/components/settings/CalculationRulesTab";
import ProposalBrandingTab from "@/components/settings/ProposalBrandingTab";
import {
  useCostReferenceTable,
  CONSTRUCTION_TYPE_LABELS,
  FINISH_LEVEL_LABELS,
  DEFAULT_COST_TABLE,
  type CostTable,
  type ConstructionType,
  type FinishLevel,
} from "@/hooks/useCostReferenceTable";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const constructionTypes = Object.keys(CONSTRUCTION_TYPE_LABELS) as ConstructionType[];
const finishLevels = Object.keys(FINISH_LEVEL_LABELS) as FinishLevel[];

export default function SettingsPage() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const { costTable, isLoading, saveCostTable } = useCostReferenceTable();
  const [localTable, setLocalTable] = useState<CostTable>(DEFAULT_COST_TABLE);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (!isLoading) setLocalTable(costTable);
  }, [costTable, isLoading]);

  const toggleTheme = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleCellChange = (ct: ConstructionType, fl: FinishLevel, value: string) => {
    setLocalTable((prev) => ({
      ...prev,
      [ct]: { ...prev[ct], [fl]: Number(value) || 0 },
    }));
  };

  const handleSaveTable = () => {
    saveCostTable.mutate(localTable);
  };

  const placeholderSections = [
    { icon: Tag, title: "Categorias de Fornecedores", desc: "Gerenciar categorias disponíveis" },
    { icon: MessageSquare, title: "Templates de Mensagem", desc: "Cobrança, comunicação com clientes" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold font-display mb-1">Configurações</h1>
      <p className="text-muted-foreground mb-4">Personalize o sistema</p>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="regras">Regras de Cálculo</TabsTrigger>
          <TabsTrigger value="proposta">Proposta</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-muted-foreground text-sm">E-mail</Label>
              <p className="font-medium">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Tema Escuro</Label>
                <p className="text-sm text-muted-foreground">
                  Alternar entre tema claro e escuro
                </p>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleTheme} />
            </div>
          </CardContent>
        </Card>

        {/* Cost per m² table — full width */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Parâmetros de Cálculo — Custo por m²
            </CardTitle>
            <Button size="sm" onClick={handleSaveTable} disabled={saveCostTable.isPending}>
              <Save className="h-4 w-4 mr-1.5" />
              Salvar
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Valores de referência usados na Estimativa Rápida de Orçamento. Edite conforme sua região e padrão.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Tipo / Nível</th>
                    {finishLevels.map((fl) => (
                      <th key={fl} className="text-center py-2 px-2 font-medium text-muted-foreground">
                        {FINISH_LEVEL_LABELS[fl]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {constructionTypes.map((ct) => (
                    <tr key={ct} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium">{CONSTRUCTION_TYPE_LABELS[ct]}</td>
                      {finishLevels.map((fl) => (
                        <td key={fl} className="py-2 px-2">
                          <Input
                            type="number"
                            min={0}
                            className="text-center h-9"
                            value={localTable[ct]?.[fl] ?? ""}
                            onChange={(e) => handleCellChange(ct, fl, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder sections */}
        {placeholderSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <section.icon className="h-5 w-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-6 text-muted-foreground">
                <Settings className="h-6 w-6 mb-2 opacity-40" />
                <p className="text-sm">{section.desc} — em breve</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
        </TabsContent>

        <TabsContent value="regras">
          <CalculationRulesTab />
        </TabsContent>

        <TabsContent value="proposta">
          <ProposalBrandingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
