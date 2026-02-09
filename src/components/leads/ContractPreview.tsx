import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import type { ContractTemplate } from "@/hooks/useContractTemplates";

interface ContractPreviewProps {
  contractNumber: string;
  clientName: string;
  clientCpfCnpj: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  constructionAddress: string;
  constructionCity: string;
  constructionNeighborhood: string;
  serviceDescription: string;
  value: number | null;
  paymentConditions: string;
  paymentMethod: string;
  startDate: string;
  estimatedDuration: string;
  customClauses: string;
  template: ContractTemplate | null;
}

function formatCurrency(v: number | null) {
  if (v == null) return "________";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function replacePlaceholders(text: string | null, vars: Record<string, string>): string {
  if (!text) return "";
  let result = text;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), val || "________");
  }
  return result;
}

export function ContractPreview(props: ContractPreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Contrato ${props.contractNumber}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.7; font-size: 13px; }
        h1 { font-size: 20px; text-align: center; border-bottom: 2px solid #333; padding-bottom: 8px; }
        h2 { font-size: 14px; color: #333; margin-top: 20px; text-transform: uppercase; }
        .clause { margin-bottom: 16px; }
        .signatures { margin-top: 60px; display: flex; justify-content: space-between; }
        .sig-line { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 4px; font-size: 12px; }
        @media print { body { padding: 20px; } }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    w.document.close();
    w.print();
  };

  const vars: Record<string, string> = {
    NOME_CLIENTE: props.clientName,
    CPF_CNPJ: props.clientCpfCnpj,
    EMAIL_CLIENTE: props.clientEmail,
    TELEFONE_CLIENTE: props.clientPhone,
    ENDERECO_CLIENTE: props.clientAddress,
    ENDERECO_OBRA: props.constructionAddress,
    CIDADE_OBRA: props.constructionCity,
    BAIRRO_OBRA: props.constructionNeighborhood,
    VALOR: formatCurrency(props.value),
    CONDICOES_PAGAMENTO: props.paymentConditions,
    FORMA_PAGAMENTO: props.paymentMethod,
    DATA_INICIO: props.startDate,
    PRAZO: props.estimatedDuration,
    DESCRICAO_SERVICOS: props.serviceDescription,
  };

  const t = props.template;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Preview do Contrato</h3>
        <Button size="sm" variant="outline" onClick={handlePrint}>
          <Printer className="h-3 w-3 mr-1" /> Imprimir / PDF
        </Button>
      </div>

      <div
        ref={printRef}
        className="bg-white text-black border rounded-lg p-8 shadow-inner max-h-[70vh] overflow-y-auto"
        style={{ fontFamily: "'Segoe UI', sans-serif", fontSize: "13px", lineHeight: "1.7" }}
      >
        <h1 style={{ fontSize: "18px", textAlign: "center", borderBottom: "2px solid #333", paddingBottom: "8px" }}>
          CONTRATO DE PRESTAÇÃO DE SERVIÇOS
        </h1>
        <p style={{ textAlign: "center", color: "#888", fontSize: "11px" }}>{props.contractNumber}</p>

        <div style={{ marginTop: "20px" }}>
          <p>
            <strong>CONTRATANTE:</strong> {props.clientName || "________"}, CPF/CNPJ: {props.clientCpfCnpj || "________"},
            residente em {props.clientAddress || "________"}, telefone {props.clientPhone || "________"}, email {props.clientEmail || "________"}.
          </p>
        </div>

        {t?.clause_object && (
          <div className="clause" style={{ marginTop: "16px" }}>
            <h2 style={{ fontSize: "13px", textTransform: "uppercase" }}>Cláusula 1ª — Do Objeto</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{replacePlaceholders(t.clause_object, vars)}</p>
          </div>
        )}

        {t?.clause_scope && (
          <div className="clause" style={{ marginTop: "12px" }}>
            <h2 style={{ fontSize: "13px", textTransform: "uppercase" }}>Cláusula 2ª — Do Escopo</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{replacePlaceholders(t.clause_scope, vars)}</p>
          </div>
        )}

        {props.serviceDescription && !t?.clause_scope && (
          <div style={{ marginTop: "12px" }}>
            <h2 style={{ fontSize: "13px", textTransform: "uppercase" }}>Serviços</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{props.serviceDescription}</p>
          </div>
        )}

        {t?.clause_value && (
          <div className="clause" style={{ marginTop: "12px" }}>
            <h2 style={{ fontSize: "13px", textTransform: "uppercase" }}>Cláusula 3ª — Do Valor</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{replacePlaceholders(t.clause_value, vars)}</p>
          </div>
        )}

        {!t?.clause_value && props.value != null && (
          <div style={{ marginTop: "12px" }}>
            <h2 style={{ fontSize: "13px", textTransform: "uppercase" }}>Valor e Pagamento</h2>
            <p>Valor total: <strong>{formatCurrency(props.value)}</strong></p>
            {props.paymentConditions && <p>Condições: {props.paymentConditions}</p>}
          </div>
        )}

        {t?.clause_duration && (
          <div className="clause" style={{ marginTop: "12px" }}>
            <h2 style={{ fontSize: "13px", textTransform: "uppercase" }}>Cláusula 4ª — Do Prazo</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{replacePlaceholders(t.clause_duration, vars)}</p>
          </div>
        )}

        {t?.clause_obligations_contractor && (
          <div className="clause" style={{ marginTop: "12px" }}>
            <h2 style={{ fontSize: "13px", textTransform: "uppercase" }}>Cláusula 5ª — Obrigações da Contratada</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{replacePlaceholders(t.clause_obligations_contractor, vars)}</p>
          </div>
        )}

        {t?.clause_obligations_client && (
          <div className="clause" style={{ marginTop: "12px" }}>
            <h2 style={{ fontSize: "13px", textTransform: "uppercase" }}>Cláusula 6ª — Obrigações do Contratante</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{replacePlaceholders(t.clause_obligations_client, vars)}</p>
          </div>
        )}

        {t?.clause_termination && (
          <div className="clause" style={{ marginTop: "12px" }}>
            <h2 style={{ fontSize: "13px", textTransform: "uppercase" }}>Cláusula 7ª — Da Rescisão</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{replacePlaceholders(t.clause_termination, vars)}</p>
          </div>
        )}

        {t?.clause_confidentiality && (
          <div className="clause" style={{ marginTop: "12px" }}>
            <h2 style={{ fontSize: "13px", textTransform: "uppercase" }}>Cláusula 8ª — Da Confidencialidade</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{replacePlaceholders(t.clause_confidentiality, vars)}</p>
          </div>
        )}

        {t?.clause_general && (
          <div className="clause" style={{ marginTop: "12px" }}>
            <h2 style={{ fontSize: "13px", textTransform: "uppercase" }}>Disposições Gerais</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{replacePlaceholders(t.clause_general, vars)}</p>
          </div>
        )}

        {props.customClauses && (
          <div style={{ marginTop: "12px" }}>
            <h2 style={{ fontSize: "13px", textTransform: "uppercase" }}>Cláusulas Específicas</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{props.customClauses}</p>
          </div>
        )}

        <div style={{ marginTop: "60px", display: "flex", justifyContent: "space-between" }}>
          <div style={{ borderTop: "1px solid #333", width: "200px", textAlign: "center", paddingTop: "4px", fontSize: "12px" }}>
            CONTRATANTE
          </div>
          <div style={{ borderTop: "1px solid #333", width: "200px", textAlign: "center", paddingTop: "4px", fontSize: "12px" }}>
            CONTRATADA
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "11px", color: "#888" }}>
          {props.constructionCity || "________"}, _____ de _____________ de {new Date().getFullYear()}.
        </p>
      </div>
    </div>
  );
}
