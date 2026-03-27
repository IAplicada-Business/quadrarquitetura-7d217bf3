import { toast } from "@/hooks/use-toast";

const FK_MESSAGES: Record<string, string> = {
  leads: "Este lead possui propostas vinculadas e não pode ser excluído. Remova as propostas primeiro.",
  proposals: "Esta proposta possui um contrato vinculado. Remova o contrato primeiro.",
  projects: "Este projeto possui dados vinculados (escopo, cronograma, materiais, etc.) e não pode ser excluído. Remova os dados do projeto primeiro.",
};

const GENERIC_FK = "Este registro está vinculado a outros dados e não pode ser excluído.";

export function handleDeleteError(error: any, table?: string) {
  const code = error?.code;
  if (code === "23503") {
    toast({
      title: "Não é possível excluir",
      description: (table && FK_MESSAGES[table]) || GENERIC_FK,
      variant: "destructive",
    });
  } else {
    toast({
      title: "Erro ao remover",
      description: error?.message || "Erro desconhecido",
      variant: "destructive",
    });
  }
}
