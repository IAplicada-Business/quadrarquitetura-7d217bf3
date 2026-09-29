import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { emptySection, type OnboardingSection } from "@/lib/onboarding";

vi.mock("@/hooks/useOnboardingTemplate", () => ({
  uploadOnboardingMedia: vi.fn(async () => "https://cdn/x.mp4"),
  useOnboardingTemplate: vi.fn(),
}));

import { OnboardingSectionsEditor } from "@/components/onboarding/OnboardingSectionsEditor";
import { OnboardingView } from "@/components/onboarding/OnboardingView";

const onChange = vi.fn<(s: OnboardingSection[]) => void>();

const base: OnboardingSection[] = [
  emptySection({ id: "s1", title: "Boas-vindas", body: "Olá **cliente**" }),
  emptySection({ id: "s2", title: "Contato", cta_label: "WhatsApp", cta_url: "https://wa.me/1" }),
];

function renderEditor(sections = base) {
  return render(<OnboardingSectionsEditor sections={sections} onChange={onChange} uploadFolder="t" />);
}

beforeEach(() => onChange.mockReset());

describe("editor de seções do onboarding", () => {
  it("lista as seções e o preview mostra o rich text e o botão", () => {
    renderEditor();
    expect(screen.getByTestId("section-s1")).toBeInTheDocument();
    const preview = screen.getByTestId("onboarding-view");
    expect(within(preview).getByText("cliente").tagName).toBe("STRONG");
    expect(within(preview).getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", "https://wa.me/1");
  });

  it("adiciona, remove e reordena", () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Adicionar seção" }));
    expect(onChange.mock.calls[0][0]).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: "Remover Contato" }));
    expect(onChange.mock.calls[1][0].map((s) => s.id)).toEqual(["s1"]);

    fireEvent.click(screen.getByRole("button", { name: "Descer Boas-vindas" }));
    expect(onChange.mock.calls[2][0].map((s) => s.id)).toEqual(["s2", "s1"]);
  });

  it("desligar uma seção mantém no editor e some do portal", () => {
    const { unmount } = renderEditor();
    fireEvent.click(screen.getByRole("switch", { name: "Mostrar Contato ao cliente" }));
    const next = onChange.mock.calls[0][0];
    expect(next.find((s) => s.id === "s2")!.is_active).toBe(false);
    unmount();

    // Portal (sem showInactive): a seção desligada não aparece.
    render(<OnboardingView sections={next} />);
    expect(screen.getByTestId("onboarding-section-s1")).toBeInTheDocument();
    expect(screen.queryByTestId("onboarding-section-s2")).not.toBeInTheDocument();
  });

  it("editar título e vídeo do YouTube reflete no preview com iframe", () => {
    const { rerender } = renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Editar Boas-vindas" }));
    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Bem-vindo à obra" } });
    let next = onChange.mock.calls.at(-1)![0];
    expect(next[0].title).toBe("Bem-vindo à obra");

    rerender(<OnboardingSectionsEditor sections={next} onChange={onChange} uploadFolder="t" />);
    fireEvent.change(screen.getByLabelText("Vídeo (YouTube, Vimeo ou upload)"), { target: { value: "https://youtu.be/abc123" } });
    next = onChange.mock.calls.at(-1)![0];
    expect(next[0].video_url).toBe("https://youtu.be/abc123");

    rerender(<OnboardingSectionsEditor sections={next} onChange={onChange} uploadFolder="t" />);
    expect(screen.getByTestId("video-kind-s1")).toHaveTextContent("YouTube reconhecido");
    const iframe = screen.getByTitle("Bem-vindo à obra") as HTMLIFrameElement;
    expect(iframe.src).toBe("https://www.youtube.com/embed/abc123");
  });

  it("adiciona imagem por URL", () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "Editar Boas-vindas" }));
    const input = screen.getByLabelText("URL de imagem da seção 1");
    fireEvent.change(input, { target: { value: "https://cdn/foto.jpg" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange.mock.calls.at(-1)![0][0].image_urls).toEqual(["https://cdn/foto.jpg"]);
  });
});
