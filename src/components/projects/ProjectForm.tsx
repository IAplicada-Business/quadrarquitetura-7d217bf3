import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Constants } from "@/integrations/supabase/types";

const statusLabels: Record<string, string> = {
  proposta_enviada: "Proposta Enviada",
  contrato_assinado: "Contrato Assinado",
  levantamento: "Levantamento",
  briefing: "Briefing",
  estudo_preliminar: "Estudo Preliminar",
  revisao: "Revisão",
  anteprojeto_3d: "Anteprojeto (3D)",
  projeto_executivo: "Projeto Executivo",
  memoria_calculo: "Memória de Cálculo",
  orcamento: "Orçamento",
  reuniao_prioridades: "Reunião de Prioridades",
  mobilizacao_fornecedores: "Mobilização de Fornecedores",
  execucao_obra: "Execução da Obra",
  concluido: "Concluído",
};

const typeLabels: Record<string, string> = {
  residencial: "Residencial",
  comercial: "Comercial",
  saude: "Saúde",
  outro: "Outro",
};

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown> | null;
  isLoading?: boolean;
}

export function ProjectForm({ open, onOpenChange, onSubmit, initialData, isLoading }: ProjectFormProps) {
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState("proposta_enviada");
  const [projectType, setProjectType] = useState("residencial");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [areaSqm, setAreaSqm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expectedEndDate, setExpectedEndDate] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [finishLevel, setFinishLevel] = useState("");

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (initialData) {
      setName((initialData.name as string) || "");
      setClientId((initialData.client_id as string) || "");
      setStatus((initialData.status as string) || "proposta_enviada");
      setProjectType((initialData.project_type as string) || "residencial");
      setAddress((initialData.address as string) || "");
      setNeighborhood((initialData.neighborhood as string) || "");
      setCity((initialData.city as string) || "");
      setAreaSqm(initialData.area_sqm ? String(initialData.area_sqm) : "");
      setStartDate((initialData.start_date as string) || "");
      setExpectedEndDate((initialData.expected_end_date as string) || "");
      setEstimatedBudget(initialData.estimated_budget ? String(initialData.estimated_budget) : "");
      setFinishLevel(initialData.finish_level ? String(initialData.finish_level) : "");
    } else {
      setName(""); setClientId(""); setStatus("proposta_enviada"); setProjectType("residencial");
      setAddress(""); setNeighborhood(""); setCity(""); setAreaSqm(""); setStartDate("");
      setExpectedEndDate(""); setEstimatedBudget(""); setFinishLevel("");
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      client_id: clientId || null,
      status,
      project_type: projectType,
      address: address || null,
      neighborhood: neighborhood || null,
      city: city || null,
      area_sqm: areaSqm ? Number(areaSqm) : null,
      start_date: startDate || null,
      expected_end_date: expectedEndDate || null,
      estimated_budget: estimatedBudget ? Number(estimatedBudget) : null,
      finish_level: finishLevel ? Number(finishLevel) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-display">{initialData ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="client">Cliente</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {clients?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.project_status.map((s) => (
                    <SelectItem key={s} value={s}>{statusLabels[s] || s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.client_type.map((t) => (
                    <SelectItem key={t} value={t}>{typeLabels[t] || t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="area">Área (m²)</Label>
              <Input id="area" type="number" step="0.01" value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="start">Data Início</Label>
              <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="end">Previsão Término</Label>
              <Input id="end" type="date" value={expectedEndDate} onChange={(e) => setExpectedEndDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="budget">Orçamento Estimado (R$)</Label>
              <Input id="budget" type="number" step="0.01" value={estimatedBudget} onChange={(e) => setEstimatedBudget(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="finish">Nível de Acabamento (1-5)</Label>
              <Input id="finish" type="number" min="1" max="5" value={finishLevel} onChange={(e) => setFinishLevel(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !name}>{initialData ? "Salvar" : "Criar Projeto"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
