import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ExternalLink, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePriceResearch, PriceResearch } from "@/hooks/usePriceResearch";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MaterialInput {
  name: string;
  unit: string;
  quantity: number;
}

interface SupplierResult {
  supplier: string;
  neighborhood: string;
  price_min: number;
  price_max: number;
  unit: string;
  source_url: string;
}

interface MaterialResult {
  material: string;
  unit: string;
  results: SupplierResult[];
  searched_at: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

interface PriceSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityName: string;
  activityId: string;
  projectId: string;
  materials: MaterialInput[];
  existingResearch?: PriceResearch[];
  onUseAvgPrice?: (materialName: string, avgPrice: number) => void;
}

export function PriceSearchDialog({
  open,
  onOpenChange,
  activityName,
  activityId,
  projectId,
  materials,
  existingResearch,
  onUseAvgPrice,
}: PriceSearchDialogProps) {
  const { user } = useAuth();
  const { saveResults } = usePriceResearch(projectId);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<MaterialResult[]>([]);
  const [showExisting, setShowExisting] = useState(!!existingResearch?.length);

  const handleSearch = async () => {
    setSearching(true);
    setShowExisting(false);
    try {
      const { data, error } = await supabase.functions.invoke("search-prices-bh", {
        body: { activity_name: activityName, materials, city: "Belo Horizonte" },
      });

      if (error) throw error;

      const searchResults: MaterialResult[] = data.results || [];
      setResults(searchResults);

      // Save to database
      const itemsToSave = searchResults
        .flatMap((mr) =>
          mr.results.length > 0
            ? [{
                project_id: projectId,
                activity_id: activityId,
                material_name: mr.material,
                price_min: Math.min(...mr.results.map((r) => r.price_min).filter((p) => p > 0)) || null,
                price_max: Math.max(...mr.results.map((r) => r.price_max).filter((p) => p > 0)) || null,
                unit: mr.unit,
                suppliers: mr.results,
                user_id: user!.id,
              }]
            : []
        );

      if (itemsToSave.length > 0) {
        saveResults.mutate(itemsToSave as any);
      }
    } catch (err: any) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const displayData = showExisting && existingResearch?.length
    ? existingResearch.map((r) => ({
        material: r.material_name,
        unit: r.unit || "",
        results: (r.suppliers || []) as SupplierResult[],
        searched_at: r.searched_at,
      }))
    : results;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-display">Pesquisa de Preços — {activityName}</DialogTitle>
        </DialogHeader>

        {displayData.length === 0 && !searching && (
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground">
              {materials.length} material(is) para pesquisar em Belo Horizonte
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              {materials.map((m, i) => (
                <div key={i}>• {m.name} ({m.quantity} {m.unit})</div>
              ))}
            </div>
            <Button onClick={handleSearch} disabled={searching}>
              <Search className="h-4 w-4 mr-2" />
              Pesquisar Preços em BH
            </Button>
          </div>
        )}

        {searching && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Pesquisando preços em Belo Horizonte...</p>
          </div>
        )}

        {displayData.length > 0 && (
          <div className="space-y-4">
            {displayData.map((mr, idx) => {
              const prices = mr.results.filter((r) => r.price_min > 0 || r.price_max > 0);
              const globalMin = prices.length > 0 ? Math.min(...prices.map((r) => r.price_min)) : 0;
              const globalMax = prices.length > 0 ? Math.max(...prices.map((r) => r.price_max)) : 0;
              const avgPrice = globalMin > 0 && globalMax > 0 ? (globalMin + globalMax) / 2 : 0;

              return (
                <Card key={idx}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold text-display">{mr.material}</CardTitle>
                      <Badge variant="outline" className="text-[10px]">
                        Atualizado em {format(new Date(mr.searched_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </Badge>
                    </div>
                    {globalMin > 0 && (
                      <p className="text-lg font-bold text-primary">
                        {formatCurrency(globalMin)} — {formatCurrency(globalMax)}
                        <span className="text-xs font-normal text-muted-foreground ml-1">por {mr.unit}</span>
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {mr.results.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum fornecedor encontrado</p>
                    ) : (
                      mr.results.map((s, si) => (
                        <div key={si} className="flex items-center justify-between text-sm border-b last:border-0 pb-2">
                          <div>
                            <span className="font-medium">{s.supplier}</span>
                            {s.neighborhood && (
                              <span className="text-muted-foreground ml-1">— {s.neighborhood}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {s.price_min > 0 && formatCurrency(s.price_min)}
                              {s.price_min > 0 && s.price_max > 0 && " – "}
                              {s.price_max > 0 && formatCurrency(s.price_max)}
                            </span>
                            {s.source_url && (
                              <a href={s.source_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    )}

                    {avgPrice > 0 && onUseAvgPrice && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={() => onUseAvgPrice(mr.material, avgPrice)}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Usar preço médio ({formatCurrency(avgPrice)}/{mr.unit})
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {!showExisting && (
              <Button variant="outline" size="sm" onClick={handleSearch} disabled={searching} className="w-full">
                <Search className="h-4 w-4 mr-1" /> Pesquisar Novamente
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
