import { ExternalLink, PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RichText } from "@/components/leads/proposal-pages/RichText";
import { parseVideoUrl, visibleSections, type OnboardingSection } from "@/lib/onboarding";

interface Props {
  sections: OnboardingSection[];
  /** Título acima das seções (ex.: nome da obra). */
  heading?: string;
  /** Mostra também as seções desligadas, esmaecidas (uso no editor). */
  showInactive?: boolean;
}

function VideoBlock({ url, title }: { url: string; title: string }) {
  const v = parseVideoUrl(url);
  if (!v) return null;
  if (v.kind === "youtube" || v.kind === "vimeo") {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border bg-black">
        <iframe
          src={v.src}
          title={title || "Vídeo"}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }
  if (v.kind === "file") {
    return (
      <video controls preload="metadata" className="w-full rounded-lg border bg-black" src={v.src}>
        Seu navegador não reproduz este vídeo. <a href={v.src}>Baixar vídeo</a>
      </video>
    );
  }
  return (
    <a href={v.src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary underline">
      <PlayCircle className="h-4 w-4" /> Assistir vídeo
    </a>
  );
}

/**
 * Renderização do onboarding como o cliente vê no portal. Usada tanto no
 * /client/:token quanto no preview do editor, pra ser fiel.
 */
export function OnboardingView({ sections, heading, showInactive }: Props) {
  const list = showInactive ? sections : visibleSections(sections);
  if (list.length === 0) return null;

  return (
    <div className="space-y-4" data-testid="onboarding-view">
      {heading && <h2 className="text-lg font-semibold">{heading}</h2>}
      {list.map((s, i) => (
        <Card key={s.id} className={!s.is_active ? "opacity-50" : undefined} data-testid={`onboarding-section-${s.id}`}>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-3">
                {s.title && <h3 className="text-base font-semibold leading-tight">{s.title}</h3>}
                {s.body && (
                  <p className="text-sm leading-relaxed text-foreground/90">
                    <RichText text={s.body} />
                  </p>
                )}
                {s.video_url && <VideoBlock url={s.video_url} title={s.title} />}
                {s.image_urls.length > 0 && (
                  <div className={`grid gap-2 ${s.image_urls.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}>
                    {s.image_urls.map((url, j) => (
                      <a key={j} href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border">
                        <img src={url} alt={`${s.title || "Imagem"} ${j + 1}`} className="h-40 w-full object-cover" loading="lazy" />
                      </a>
                    ))}
                  </div>
                )}
                {s.cta_label && s.cta_url && (
                  <a
                    href={s.cta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {s.cta_label} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
