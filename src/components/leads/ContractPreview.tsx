import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, Eye } from "lucide-react";
import { buildContractPages } from "./ContractPageRenderer";
import type { ContractPageProps } from "./contract-pages/shared";
import { generateContractPdf, downloadContractPdf, uploadContractPdf } from "@/lib/generateContractPdf";
import { toast } from "@/hooks/use-toast";

interface ContractPreviewProps {
  contractData: ContractPageProps;
  onPdfGenerated?: (url: string) => void;
}

export function ContractPreview({ contractData, onPdfGenerated }: ContractPreviewProps) {
  const [generating, setGenerating] = useState(false);
  const pages = buildContractPages(contractData);

  const handleGeneratePdf = async () => {
    setGenerating(true);
    try {
      const blob = await generateContractPdf(contractData);
      await downloadContractPdf(blob, contractData.clientName);

      // Upload to storage
      const url = await uploadContractPdf(blob, contractData.clientName);
      if (url && onPdfGenerated) {
        onPdfGenerated(url);
      }
      toast({ title: "PDF gerado com sucesso!" });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao gerar PDF", description: String(err), variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Preview do Contrato</h3>
        <Button size="sm" variant="default" onClick={handleGeneratePdf} disabled={generating}>
          {generating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileDown className="h-3 w-3 mr-1" />}
          {generating ? "Gerando..." : "Gerar PDF"}
        </Button>
      </div>

      <div className="bg-gray-100 rounded-lg p-3 max-h-[70vh] overflow-y-auto space-y-3">
        {pages.map((page, i) => (
          <div
            key={i}
            className="shadow-md rounded overflow-hidden"
            style={{
              transform: "scale(0.48)",
              transformOrigin: "top left",
              width: 595,
              height: 842,
              marginBottom: -842 * 0.52 + 12,
            }}
          >
            {page}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {pages.length} pagina(s) • O PDF final tera resolucao superior
      </p>
    </div>
  );
}
