import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

let naoLidas = 0;

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: naoLidas,
    isLoading: false,
    create: { mutate: vi.fn(), isPending: false },
    markAsRead: { mutate: vi.fn() },
    markAllAsRead: { mutate: vi.fn() },
    remove: { mutate: vi.fn() },
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "mariana@quadra.com", user_metadata: { full_name: "Mariana Cabral" } },
    signOut: vi.fn(),
  }),
}));

// Dependências pesadas que não interessam a este teste.
vi.mock("@/components/layout/VoiceAgentDialog", () => ({
  VoiceAgentDialog: ({ open }: { open: boolean }) => (open ? <div>painel-de-audio</div> : null),
}));
vi.mock("@/components/buddy/BuddyMenu", () => ({ BuddyMenu: () => null }));
vi.mock("@/components/buddy/DocsProjetoMenu", () => ({ DocsProjetoMenu: () => null }));

import { AppHeader } from "@/components/layout/AppHeader";

function abrirPerfil() {
  const gatilho = screen.getByRole("button", { name: /Mariana/ });
  fireEvent.keyDown(gatilho, { key: "Enter" });
  return gatilho;
}

function renderHeader() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  naoLidas = 0;
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("menu do perfil no header", () => {
  it("não deixa mais os três botões soltos no header", () => {
    renderHeader();
    for (const nome of ["Assistente de Voz", "Notificações", "Alternar tema"]) {
      expect(screen.queryByRole("button", { name: nome })).toBeNull();
    }
  });

  it("mostra Áudio, Notificações e Visual ao clicar no perfil", async () => {
    renderHeader();
    abrirPerfil();
    for (const nome of ["Áudio", "Notificações", "Visual"]) {
      expect(await screen.findByRole("menuitem", { name: new RegExp(nome) })).toBeInTheDocument();
    }
  });

  it("Áudio abre o assistente de voz", async () => {
    renderHeader();
    abrirPerfil();
    fireEvent.click(await screen.findByRole("menuitem", { name: /Áudio/ }));
    await waitFor(() => expect(screen.getByText("painel-de-audio")).toBeInTheDocument());
  });

  it("Notificações abre o painel", async () => {
    renderHeader();
    abrirPerfil();
    fireEvent.click(await screen.findByRole("menuitem", { name: /Notificações/ }));
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: /Notificações/ })).toBeInTheDocument(),
    );
  });

  it("Visual alterna o tema e mantém o menu aberto", async () => {
    renderHeader();
    abrirPerfil();
    const visual = await screen.findByRole("menuitem", { name: /Visual/ });
    expect(visual.textContent).toContain("Claro");

    fireEvent.click(visual);

    await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(true));
    expect(localStorage.getItem("theme")).toBe("dark");
    // o item continua em tela: o menu não fechou no clique
    expect(screen.getByRole("menuitem", { name: /Visual/ }).textContent).toContain("Escuro");
  });

  it("sem não lidas, nenhum contador aparece no menu", async () => {
    renderHeader();
    abrirPerfil();
    const item = await screen.findByRole("menuitem", { name: /Notificações/ });
    expect(item.textContent).toBe("Notificações");
  });

  it("com não lidas, o contador aparece no menu e um ponto marca o avatar", async () => {
    naoLidas = 3;
    const { container } = renderHeader();
    const gatilho = abrirPerfil();

    const item = await screen.findByRole("menuitem", { name: /Notificações/ });
    expect(item.textContent).toContain("3");
    // ponto no próprio botão do perfil — sem ele, notificação nova ficaria
    // invisível até alguém abrir o menu
    expect(gatilho.querySelector(".bg-destructive")).not.toBeNull();
    expect(container).toBeTruthy();
  });

  it("acima de 9 não lidas o contador vira 9+", async () => {
    naoLidas = 42;
    renderHeader();
    abrirPerfil();
    const item = await screen.findByRole("menuitem", { name: /Notificações/ });
    expect(item.textContent).toContain("9+");
  });
});
