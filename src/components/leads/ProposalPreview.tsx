import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface ProposalPreviewProps {
  proposalNumber: string;
  leadName: string;
  title: string;
  projectDescription: string;
  services: {
    architectural: boolean;
    construction: boolean;
    interior: boolean;
    visualization: boolean;
    custom: string;
  };
  value: number | null;
  discountPercent: number | null;
  finalValue: number | null;
  paymentConditions: string;
  paymentMethod: string;
  deadline: string;
  estimatedArea: number | null;
  templateIntroduction: string;
  templateMethodology: string;
  templateDifferentials: string;
  templateTerms: string;
}

function formatCurrency(v: number | null) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export function ProposalPreview(props: ProposalPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Proposta ${props.proposalNumber}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; font-size: 14px; }
        h1 { font-size: 22px; color: #333; border-bottom: 2px solid #333; padding-bottom: 8px; }
        h2 { font-size: 16px; color: #555; margin-top: 24px; }
        .header { text-align: center; margin-bottom: 32px; }
        .section { margin-bottom: 20px; }
        .value-box { background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0; }
        .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 16px; font-size: 12px; color: #888; }
        ul { padding-left: 20px; }
        @media print { body { padding: 20px; } }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const servicesList: string[] = [];
  if (props.services.architectural) servicesList.push("Projeto Arquitetônico completo");
  if (props.services.construction) servicesList.push("Gerenciamento e Acompanhamento de Obra");
  if (props.services.interior) servicesList.push("Design de Interiores");
  if (props.services.visualization) servicesList.push("Visualização 3D e Renders");
  if (props.services.custom) servicesList.push(props.services.custom);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Preview da Proposta</h3>
        <Button size="sm" variant="outline" onClick={handlePrint}>
          <Printer className="h-3 w-3 mr-1" /> Imprimir / PDF
        </Button>
      </div>

      <div
        ref={printRef}
        className="bg-white text-black border rounded-lg p-8 shadow-inner max-h-[70vh] overflow-y-auto"
        style={{ fontFamily: "'Segoe UI', sans-serif", fontSize: "13px", lineHeight: "1.6" }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "20px", borderBottom: "2px solid #333", paddingBottom: "8px", margin: 0 }}>
            PROPOSTA COMERCIAL
          </h1>
          <p style={{ color: "#888", fontSize: "12px", marginTop: "4px" }}>{props.proposalNumber}</p>
        </div>

        <p>Prezado(a) <strong>{props.leadName || "Cliente"}</strong>,</p>

        {props.templateIntroduction && (
          <div style={{ marginTop: "16px" }}>
            <p>{props.templateIntroduction}</p>
          </div>
        )}

        {props.title && (
          <div style={{ marginTop: "16px" }}>
            <h2 style={{ fontSize: "15px", color: "#555" }}>{props.title}</h2>
          </div>
        )}

        {props.projectDescription && (
          <div style={{ marginTop: "12px" }}>
            <h2 style={{ fontSize: "14px", color: "#555" }}>Descrição dos Serviços</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{props.projectDescription}</p>
          </div>
        )}

        {servicesList.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <h2 style={{ fontSize: "14px", color: "#555" }}>Serviços Inclusos</h2>
            <ul style={{ paddingLeft: "20px" }}>
              {servicesList.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        {props.estimatedArea && (
          <p style={{ marginTop: "8px" }}>Área estimada: <strong>{props.estimatedArea} m²</strong></p>
        )}

        {props.templateMethodology && (
          <div style={{ marginTop: "16px" }}>
            <h2 style={{ fontSize: "14px", color: "#555" }}>Metodologia de Trabalho</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{props.templateMethodology}</p>
          </div>
        )}

        {props.templateDifferentials && (
          <div style={{ marginTop: "16px" }}>
            <h2 style={{ fontSize: "14px", color: "#555" }}>Nossos Diferenciais</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{props.templateDifferentials}</p>
          </div>
        )}

        <div style={{ background: "#f5f5f5", padding: "16px", borderRadius: "8px", marginTop: "20px" }}>
          <h2 style={{ fontSize: "14px", color: "#555", marginTop: 0 }}>Investimento</h2>
          {props.value != null && <p>Valor: <strong>{formatCurrency(props.value)}</strong></p>}
          {props.discountPercent != null && props.discountPercent > 0 && <p>Desconto: {props.discountPercent}%</p>}
          {props.finalValue != null && <p style={{ fontSize: "16px" }}>Valor Final: <strong>{formatCurrency(props.finalValue)}</strong></p>}
          {props.paymentConditions && <p>Condições: {props.paymentConditions}</p>}
          {props.paymentMethod && <p>Forma: {props.paymentMethod}</p>}
          {props.deadline && <p>Prazo estimado: {props.deadline}</p>}
        </div>

        {props.templateTerms && (
          <div style={{ marginTop: "16px" }}>
            <h2 style={{ fontSize: "14px", color: "#555" }}>Termos e Condições</h2>
            <p style={{ whiteSpace: "pre-wrap", fontSize: "12px" }}>{props.templateTerms}</p>
          </div>
        )}

        <div style={{ marginTop: "40px", borderTop: "1px solid #ddd", paddingTop: "16px", fontSize: "11px", color: "#888", textAlign: "center" }}>
          <p>Proposta válida por 30 dias a partir da data de emissão.</p>
        </div>
      </div>
    </div>
  );
}
