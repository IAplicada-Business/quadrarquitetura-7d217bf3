import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BudgetQuoteForm } from "@/components/projects/BudgetQuoteForm";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
    }),
  },
}));

function renderForm(props: Partial<React.ComponentProps<typeof BudgetQuoteForm>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <BudgetQuoteForm
        open
        onOpenChange={() => {}}
        onSubmit={() => {}}
        disciplineOptions={[
          { discipline: "Alvenaria", scopeItemId: "scope-1" },
          { discipline: "Elétrica", scopeItemId: null },
        ]}
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe("BudgetQuoteForm — vincular disciplina", () => {
  // Regressão: a opção "Sem disciplina" usava value="", que o Radix Select
  // rejeita com throw — o formulário inteiro quebrava ao abrir, então
  // "Use Editar para vincular" nunca funcionava.
  it("renderiza sem quebrar quando há disciplinas para vincular", () => {
    expect(() => renderForm()).not.toThrow();
    expect(screen.getByText("Disciplina")).toBeInTheDocument();
  });

  it("pré-seleciona a disciplina já derivada da cotação", () => {
    renderForm({ initialData: { id: "q1", scope_item_id: null, _discipline: "Elétrica" } });
    // aparece no título ("Editar Cotação — Elétrica") e no gatilho do select
    expect(screen.getAllByText("Elétrica").length).toBeGreaterThan(0);
  });

  it("explica o que fazer quando a obra não tem disciplina cadastrada", () => {
    renderForm({ disciplineOptions: [] });
    expect(screen.getByText(/Nenhuma disciplina cadastrada ainda/)).toBeInTheDocument();
  });

  it("manda criar o item de escopo quando a disciplina escolhida não tem um", () => {
    const onSubmit = vi.fn();
    renderForm({
      onSubmit,
      initialData: { id: "q1", scope_item_id: null, _discipline: "Elétrica" },
    });
    screen.getByRole("button", { name: /Salvar/ }).click();

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.scope_item_id).toBeNull();
    expect(payload._link_discipline).toBe("Elétrica");
  });

  it("usa o scope_item existente quando a disciplina já tem um", () => {
    const onSubmit = vi.fn();
    renderForm({
      onSubmit,
      initialData: { id: "q1", scope_item_id: "scope-1" },
    });
    screen.getByRole("button", { name: /Salvar/ }).click();

    const payload = onSubmit.mock.calls[0][0];
    expect(payload.scope_item_id).toBe("scope-1");
    expect(payload._link_discipline).toBeNull();
  });
});
