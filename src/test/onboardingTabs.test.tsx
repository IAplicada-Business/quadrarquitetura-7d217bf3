import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { emptySection, type OnboardingSection } from "@/lib/onboarding";

/* ---------- mocks ---------- */
const templateSave = vi.fn();
let templateSections: OnboardingSection[] = [];

const saveOverride = vi.fn();
const setEnabled = vi.fn();
const resetToTemplate = vi.fn();
let overrideSections: OnboardingSection[] | null = null;

vi.mock("@/hooks/useOnboardingTemplate", () => ({
  uploadOnboardingMedia: vi.fn(),
  useOnboardingTemplate: () => ({
    template: { id: "tpl" },
    sections: templateSections,
    isLoading: false,
    isFetched: true,
    dataUpdatedAt: 1,
    save: { mutate: templateSave, isPending: false },
  }),
}));

vi.mock("@/hooks/useProjectOnboarding", () => ({
  useProjectOnboarding: () => ({
    override: overrideSections ? { id: "ov", is_enabled: true } : null,
    overrideSections,
    templateSections,
    template: { id: "tpl" },
    effectiveSections: overrideSections ?? templateSections,
    usesTemplate: overrideSections == null,
    isEnabled: true,
    isLoading: false,
    isFetched: true,
    dataUpdatedAt: 1,
    saveOverride: { mutate: saveOverride, isPending: false },
    setEnabled: { mutate: setEnabled, isPending: false },
    resetToTemplate: { mutate: resetToTemplate, isPending: false },
  }),
}));

vi.mock("@/hooks/useClientPortalToken", () => ({
  useClientPortalToken: () => ({ activeToken: { token: "tok123" }, isLoading: false }),
}));

import OnboardingTemplateTab from "@/components/settings/OnboardingTemplateTab";
import { ProjectOnboardingTab } from "@/components/projects/ProjectOnboardingTab";

beforeEach(() => {
  templateSave.mockReset();
  saveOverride.mockReset();
  setEnabled.mockReset();
  resetToTemplate.mockReset();
  templateSections = [
    emptySection({ id: "t1", title: "Boas-vindas", body: "Olá" }),
    emptySection({ id: "t2", title: "Vídeo de apresentação", video_url: "https://youtu.be/tpl" }),
  ];
  overrideSections = null;
});

describe("Configurações → Onboarding (template padrão)", () => {
  it("template vazio oferece sugestão e salva as seções", () => {
    templateSections = [];
    render(<OnboardingTemplateTab />);
    fireEvent.click(screen.getByRole("button", { name: /Começar com a sugestão/ }));
    expect(screen.getByText("Alterações não salvas")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Salvar template/ }));
    expect(templateSave).toHaveBeenCalledTimes(1);
    expect(templateSave.mock.calls[0][0]).toHaveLength(4); // capa + 3 passos
  });

  it("adicionar seções e salvar manda a lista completa em ordem", () => {
    render(<OnboardingTemplateTab />);
    fireEvent.click(screen.getByRole("button", { name: "Adicionar seção" }));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar seção" }));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar seção" }));
    fireEvent.click(screen.getByRole("button", { name: /Salvar template/ }));
    const salvo = templateSave.mock.calls[0][0] as OnboardingSection[];
    expect(salvo).toHaveLength(5);
    expect(salvo.slice(0, 2).map((s) => s.id)).toEqual(["t1", "t2"]);
  });
});

describe("Projeto → Onboarding (override por obra)", () => {
  it("obra nova já vem com o template padrão preenchido", () => {
    render(<ProjectOnboardingTab projectId="p1" projectName="Apto 101" />);
    expect(screen.getByText("Usando template padrão")).toBeInTheDocument();
    // Aparece na lista do editor e no preview.
    expect(screen.getAllByText("Boas-vindas").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Vídeo de apresentação").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("button", { name: /Salvar para esta obra/ })).toBeDisabled();
    expect(screen.getByRole("link", { name: /Abrir portal/ })).toHaveAttribute("href", expect.stringContaining("/client/tok123"));
  });

  it("trocar o vídeo de uma seção salva uma cópia só da obra, sem tocar no template", () => {
    render(<ProjectOnboardingTab projectId="p1" />);
    fireEvent.click(screen.getByRole("button", { name: "Editar Vídeo de apresentação" }));
    fireEvent.change(screen.getByLabelText("Vídeo (YouTube, Vimeo ou upload)"), { target: { value: "https://youtu.be/obra" } });
    fireEvent.click(screen.getByRole("button", { name: /Salvar para esta obra/ }));

    expect(saveOverride).toHaveBeenCalledTimes(1);
    const { sections } = saveOverride.mock.calls[0][0] as { sections: OnboardingSection[] };
    expect(sections).toHaveLength(2);
    // ids novos (cópia), com a origem registrada
    expect(sections.map((s) => s.id)).not.toContain("t1");
    expect(sections[1].source_section_id).toBe("t2");
    expect(sections[1].video_url).toBe("https://youtu.be/obra");
    expect(sections[0].video_url).toBeNull();
    // template continua com o vídeo original
    expect(templateSections[1].video_url).toBe("https://youtu.be/tpl");
    expect(templateSave).not.toHaveBeenCalled();
  });

  it("obra personalizada mostra o badge e permite voltar ao template com confirmação", () => {
    overrideSections = [emptySection({ id: "o1", title: "Só desta obra" })];
    render(<ProjectOnboardingTab projectId="p1" />);
    expect(screen.getByText("Personalizado para esta obra")).toBeInTheDocument();
    expect(screen.getAllByText("Só desta obra").length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole("button", { name: /Voltar a seguir o template/ }));
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao template" }));
    expect(resetToTemplate).toHaveBeenCalledTimes(1);
  });

  it("'Usar template padrão' puxa as seções do global para customizar em cima", () => {
    overrideSections = [emptySection({ id: "o1", title: "Só desta obra" })];
    render(<ProjectOnboardingTab projectId="p1" />);
    fireEvent.click(screen.getByRole("button", { name: /Usar template padrão/ }));
    expect(screen.queryByText("Só desta obra")).not.toBeInTheDocument();
    expect(screen.getAllByText("Boas-vindas").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Alterações não salvas")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Salvar para esta obra/ }));
    const { sections } = saveOverride.mock.calls[0][0] as { sections: OnboardingSection[] };
    expect(sections.map((s) => s.source_section_id)).toEqual(["t1", "t2"]);
  });

  it("reordenar persiste a nova ordem", () => {
    render(<ProjectOnboardingTab projectId="p1" />);
    fireEvent.click(screen.getByRole("button", { name: "Descer Boas-vindas" }));
    fireEvent.click(screen.getByRole("button", { name: /Salvar para esta obra/ }));
    const { sections } = saveOverride.mock.calls[0][0] as { sections: OnboardingSection[] };
    expect(sections.map((s) => s.title)).toEqual(["Vídeo de apresentação", "Boas-vindas"]);
  });

  it("interruptor de visibilidade chama setEnabled", () => {
    render(<ProjectOnboardingTab projectId="p1" />);
    fireEvent.click(screen.getByRole("switch", { name: "Mostrar onboarding no portal desta obra" }));
    expect(setEnabled).toHaveBeenCalledWith(false);
  });
});
