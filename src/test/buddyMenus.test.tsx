import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** Linhas que a consulta a iaplicada_links devolve — trocadas por teste. */
let linksDoProjeto: unknown[] = [];
let erroNosLinks: { message: string } | null = null;

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: linksDoProjeto, error: erroNosLinks }),
      }),
    }),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}));

vi.mock("@/lib/oportunidades.functions", () => ({
  listarPendentesAprovacaoAutor: () =>
    Promise.resolve([{ id: "o1", numero: "OPT-0007", titulo: "Card salta", tipo: "bug" }]),
}));

import { BuddyMenu } from "@/components/buddy/BuddyMenu";
import { DocsProjetoMenu } from "@/components/buddy/DocsProjetoMenu";

/** jsdom não tem PointerEvent, então o pointerdown do Radix não dispara.
 *  Enter no gatilho abre o mesmo menu pelo caminho de teclado. */
function abrirMenu(botao: HTMLElement) {
  fireEvent.keyDown(botao, { key: "Enter" });
}

function renderComProviders(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  linksDoProjeto = [];
  erroNosLinks = null;
});

describe("BuddyMenu (menu superior)", () => {
  it("é um ícone discreto, sem texto ao lado", () => {
    renderComProviders(<BuddyMenu />);
    const botao = screen.getByRole("button", { name: "Buddy IAplicada" });
    expect(botao).toHaveAttribute("title", "Buddy");
    expect(botao.textContent).toBe("");
  });

  it("abre com Bug ativo e Training/News em breve", async () => {
    renderComProviders(<BuddyMenu />);
    abrirMenu(screen.getByRole("button", { name: "Buddy IAplicada" }));

    const bug = await screen.findByRole("menuitem", { name: /Bug/ });
    expect(bug).not.toHaveAttribute("aria-disabled", "true");

    for (const nome of ["Training", "News"]) {
      const item = screen.getByRole("menuitem", { name: new RegExp(nome) });
      expect(item).toHaveAttribute("aria-disabled", "true");
      expect(item.textContent).toContain("em breve");
    }
  });

  it("mostra a contagem de entregas que o usuário precisa aprovar", async () => {
    renderComProviders(<BuddyMenu />);
    abrirMenu(screen.getByRole("button", { name: "Buddy IAplicada" }));
    const bug = await screen.findByRole("menuitem", { name: /Bug/ });
    await waitFor(() => expect(bug.textContent).toContain("1"));
  });
});

describe("DocsProjetoMenu (logo do cliente)", () => {
  it("não aparece quando a tabela está vazia", async () => {
    const { container } = renderComProviders(<DocsProjetoMenu />);
    await waitFor(() => expect(container.querySelector("button")).toBeNull());
  });

  it("não aparece — nem quebra o header — se a consulta falhar", async () => {
    erroNosLinks = { message: 'relation "iaplicada_links" does not exist' };
    const { container } = renderComProviders(<DocsProjetoMenu />);
    await waitFor(() => expect(container.querySelector("button")).toBeNull());
  });

  it("item com url abre em nova aba; item sem url fica em breve", async () => {
    linksDoProjeto = [
      { chave: "mapeamento", label: "Mapeamento empresarial", url: null, descricao: "Como a empresa opera", ordem: 1 },
      { chave: "portal", label: "Portal do cliente", url: "https://exemplo.com", descricao: "Roadmap", ordem: 2 },
    ];
    renderComProviders(<DocsProjetoMenu />);

    abrirMenu(await screen.findByRole("button", { name: "Docs do projeto" }));

    const mapeamento = await screen.findByRole("menuitem", { name: /Mapeamento empresarial/ });
    expect(mapeamento).toHaveAttribute("aria-disabled", "true");
    expect(mapeamento.textContent).toContain("em breve");

    const portal = screen.getByRole("menuitem", { name: /Portal do cliente/ });
    expect(portal).toHaveAttribute("href", "https://exemplo.com");
    expect(portal).toHaveAttribute("target", "_blank");
    expect(portal).toHaveAttribute("rel", "noreferrer");
    expect(portal.textContent).not.toContain("em breve");
  });

  it("respeita a ordem da coluna `ordem`", async () => {
    linksDoProjeto = [
      { chave: "mapeamento", label: "Mapeamento empresarial", url: "https://a.com", descricao: null, ordem: 1 },
      { chave: "portal", label: "Portal do cliente", url: "https://b.com", descricao: null, ordem: 2 },
      { chave: "treinamento", label: "Treinamento", url: "https://c.com", descricao: null, ordem: 3 },
    ];
    renderComProviders(<DocsProjetoMenu />);
    abrirMenu(await screen.findByRole("button", { name: "Docs do projeto" }));

    const itens = await screen.findAllByRole("menuitem");
    expect(itens.map((i) => i.textContent)).toEqual([
      "Mapeamento empresarial",
      "Portal do cliente",
      "Treinamento",
    ]);
  });
});
