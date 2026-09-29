import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Save,
  Undo2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  EyeOff,
  Upload,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useProposalBlocks } from "@/hooks/useProposalBlocks";
import { useProposalAssets } from "@/hooks/useProposalAssets";
import { buildProposalPages, proposalPageKeys } from "@/components/leads/ProposalPageRenderer";
import { PAGE_W, PAGE_H, type ProposalPageProps } from "@/components/leads/proposal-pages/shared";
import {
  blockContent,
  getBlockDefinition,
  moveProposalBlock,
  proposalBlocksEqual,
  toProposalBlockUpserts,
  DEFAULT_ABOUT_TEXT,
  newFlowStepKey,
  FLOW_STEP_TIMELINE,
  type AboutContent,
  type BlockCard,
  type BlockFieldDef,
  type ProposalBlockKey,
  type ResolvedProposalBlock,
} from "@/lib/proposalBlocks";
import { RichTextField } from "./RichTextField";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Antes do time salvar o bloco "Quem Somos" pela primeira vez, o texto que
 * vale no PDF é o "quem_somos" de Textos Fixos. Semeia o rascunho com ele
 * pra que o editor mostre exatamente o que sai hoje.
 */
export function seedBlocksFromAssets(blocks: ResolvedProposalBlock[], aboutFromAssets?: string | null): ResolvedProposalBlock[] {
  const about = aboutFromAssets?.trim();
  if (!about) return blocks;
  return blocks.map((b) => {
    if (b.key !== "about" || !b.isDefault) return b;
    const content = b.content as AboutContent;
    if (content.body !== DEFAULT_ABOUT_TEXT) return b;
    return { ...b, content: { ...content, body: about } };
  });
}

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#D4B8A0"/><text x="200" y="158" font-family="sans-serif" font-size="20" fill="#1B2A4A" text-anchor="middle">Foto do projeto</text></svg>`,
  );

/* ------------------------------------------------------------------ */
/* Campos                                                              */
/* ------------------------------------------------------------------ */

function CardsField({
  field,
  cards,
  onChange,
  blockKey,
}: {
  field: BlockFieldDef;
  cards: BlockCard[];
  onChange: (cards: BlockCard[]) => void;
  blockKey: string;
}) {
  const shape = field.cardShape ?? "desc";
  const labels = { title: "Título", desc: "Descrição", items: "Itens (um por linha)", ...field.cardLabels };
  const isSteps = shape === "steps";

  const update = (i: number, patch: Partial<BlockCard>) => {
    onChange(cards.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  };
  const remove = (i: number) => onChange(cards.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= cards.length) return;
    const next = [...cards];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () =>
    onChange([
      ...cards,
      shape === "items" ? { title: "", items: [] } : isSteps ? { key: newFlowStepKey(), title: "", desc: "", meta: "" } : { title: "", desc: "" },
    ]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">{field.label}</Label>
        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={add}>
          <Plus className="h-3 w-3 mr-1" /> Adicionar
        </Button>
      </div>
      {field.hint && <p className="text-[11px] text-muted-foreground">{field.hint}</p>}
      {cards.length === 0 && <p className="text-xs text-muted-foreground">Nenhum item. Adicione pelo menos um.</p>}
      {cards.map((card, i) => (
        <div key={card.key ?? i} className="border rounded-md p-2.5 space-y-2 bg-background" data-testid={`${blockKey}-${field.key}-card-${i}`}>
          {isSteps && (
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {card.key && FLOW_STEP_TIMELINE[card.key] ? "Etapa original · prazo vem da proposta" : "Etapa nova · prazo fixo abaixo"}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Input
              value={card.title}
              placeholder={labels.title}
              aria-label={`${field.label} ${i + 1}: ${labels.title}`}
              onChange={(e) => update(i, { title: e.target.value })}
              className="h-8 text-sm"
            />
            <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" title="Mover para cima" onClick={() => move(i, -1)} disabled={i === 0}>
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" title="Mover para baixo" onClick={() => move(i, 1)} disabled={i === cards.length - 1}>
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" title="Remover item" aria-label={`Remover ${field.label} ${i + 1}`} onClick={() => remove(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          {shape === "desc" || isSteps ? (
            <RichTextField
              value={card.desc ?? ""}
              rows={2}
              placeholder={labels.desc}
              aria-label={`${field.label} ${i + 1}: ${labels.desc}`}
              onChange={(v) => update(i, { desc: v })}
            />
          ) : (
            <Textarea
              value={(card.items ?? []).join("\n")}
              rows={4}
              placeholder={labels.items}
              aria-label={`${field.label} ${i + 1}: ${labels.items}`}
              className="text-sm"
              onChange={(e) => update(i, { items: e.target.value.split("\n") })}
            />
          )}
          {isSteps && !(card.key && FLOW_STEP_TIMELINE[card.key]) && (
            <Input
              value={card.meta ?? ""}
              placeholder="Prazo exibido (ex.: 7 dias)"
              aria-label={`${field.label} ${i + 1}: Prazo`}
              onChange={(e) => update(i, { meta: e.target.value })}
              className="h-8 text-sm"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ImageField({
  id,
  field,
  value,
  onChange,
  suggestions,
}: {
  id: string;
  field: BlockFieldDef;
  value: string;
  onChange: (url: string) => void;
  suggestions: { id: string; name: string; url: string }[];
}) {
  const { uploadFile } = useProposalAssets();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const url = await uploadFile(files[0], "blocos");
      onChange(url);
    } catch (e) {
      toast({ title: "Erro no upload", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-semibold flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> {field.label}</Label>
      <div className="flex items-start gap-3">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded border bg-muted/40 flex items-center justify-center">
          {value ? <img src={value} alt={field.label} className="h-full w-full object-cover" /> : <span className="text-[10px] text-muted-foreground text-center px-1">padrão do app</span>}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Input id={id} value={value} placeholder="URL da imagem ou envie um arquivo" className="h-8 text-sm" onChange={(e) => onChange(e.target.value)} />
            <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border px-2 text-xs hover:bg-muted whitespace-nowrap">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Upload
              <input type="file" accept="image/*" className="hidden" disabled={uploading} aria-label={`Enviar ${field.label}`} onChange={(e) => handleUpload(e.target.files)} />
            </label>
            {value && (
              <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" onClick={() => onChange("")}>Usar padrão</Button>
            )}
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  title={s.name}
                  aria-label={`Usar ${s.name}`}
                  onClick={() => onChange(s.url)}
                  className={`h-10 w-14 overflow-hidden rounded border hover:ring-2 hover:ring-primary ${value === s.url ? "ring-2 ring-primary" : ""}`}
                >
                  <img src={s.url} alt={s.name} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {field.hint && <p className="text-[11px] text-muted-foreground">{field.hint}</p>}
        </div>
      </div>
    </div>
  );
}

function BlockFields({
  block,
  onChange,
  imageSuggestions,
}: {
  block: ResolvedProposalBlock;
  onChange: (content: Record<string, unknown>) => void;
  imageSuggestions: { id: string; name: string; url: string }[];
}) {
  const def = getBlockDefinition(block.key);
  if (!def) return null;
  const content = block.content as unknown as Record<string, unknown>;
  const set = (key: string, value: unknown) => onChange({ ...content, [key]: value });

  return (
    <div className="space-y-4">
      {def.fields.map((field) => {
        const id = `block-${block.key}-${field.key}`;
        if (field.kind === "image") {
          return (
            <ImageField
              key={field.key}
              id={id}
              field={field}
              value={typeof content[field.key] === "string" ? (content[field.key] as string) : ""}
              onChange={(url) => set(field.key, url)}
              suggestions={imageSuggestions}
            />
          );
        }
        if (field.kind === "cards") {
          return (
            <CardsField
              key={field.key}
              field={field}
              blockKey={block.key}
              cards={(content[field.key] as BlockCard[]) ?? []}
              onChange={(cards) => set(field.key, cards)}
            />
          );
        }
        const value = typeof content[field.key] === "string" ? (content[field.key] as string) : "";
        return (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={id} className="text-xs font-semibold">{field.label}</Label>
            {field.kind === "richtext" ? (
              <RichTextField id={id} value={value} onChange={(v) => set(field.key, v)} rows={field.key === "body" || field.key === "defaultText" ? 6 : 3} />
            ) : (
              <Input id={id} value={value} onChange={(e) => set(field.key, e.target.value)} className="h-8 text-sm" />
            )}
            {field.hint && <p className="text-[11px] text-muted-foreground">{field.hint}</p>}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Preview                                                             */
/* ------------------------------------------------------------------ */

function ScaledPage({ page }: { page: React.ReactElement }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth || PAGE_W * 0.5;
      setScale(Math.min(1, w / PAGE_W));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="w-full" style={{ height: PAGE_H * scale }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: PAGE_W, height: PAGE_H }} className="shadow-md">
        {page}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Editor                                                              */
/* ------------------------------------------------------------------ */

export default function ProposalBlocksEditor() {
  const { blocks, isLoading, isFetched, dataUpdatedAt, save } = useProposalBlocks();
  const { logos, founderPhotos, portfolio, texts, contacts } = useProposalAssets();

  const aboutFromAssets = useMemo(
    () => texts.find((t) => (t.metadata as Record<string, unknown> | null)?.key === "quem_somos")?.description ?? null,
    [texts],
  );

  const baseline = useMemo(() => seedBlocksFromAssets(blocks, aboutFromAssets), [blocks, aboutFromAssets]);

  const [draft, setDraft] = useState<ResolvedProposalBlock[] | null>(null);
  const [expanded, setExpanded] = useState<ProposalBlockKey | null>(null);
  const [previewKey, setPreviewKey] = useState<ProposalBlockKey>("cover");
  const dirtyRef = useRef(false);

  const dirty = draft != null && !proposalBlocksEqual(draft, baseline);
  dirtyRef.current = dirty;

  // Sincroniza o rascunho com o servidor quando não há edição pendente.
  useEffect(() => {
    if (!isFetched) return;
    if (draft == null || !dirtyRef.current) setDraft(baseline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseline, isFetched, dataUpdatedAt]);

  const updateBlock = useCallback((key: ProposalBlockKey, patch: Partial<ResolvedProposalBlock>) => {
    setDraft((d) => (d ? d.map((b) => (b.key === key ? ({ ...b, ...patch } as ResolvedProposalBlock) : b)) : d));
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!draft || !result.destination || result.destination.index === result.source.index) return;
    setDraft(moveProposalBlock(draft, result.source.index, result.destination.index));
  };

  const resetBlock = (key: ProposalBlockKey) => {
    const def = getBlockDefinition(key);
    updateBlock(key, { label: def?.label ?? key, is_active: true, content: blockContent(key) as ResolvedProposalBlock["content"] });
  };

  const discard = () => setDraft(baseline);

  const handleSave = () => {
    if (!draft) return;
    save.mutate(toProposalBlockUpserts(draft));
  };

  /* Preview -------------------------------------------------------- */

  const sampleProps = useMemo<ProposalPageProps>(() => {
    const instagram = contacts.find((c) => c.name === "Instagram")?.description;
    const phone1 = contacts.find((c) => c.name === "Telefone 1")?.description;
    const phone2 = contacts.find((c) => c.name === "Telefone 2")?.description;
    const validUntil = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const cards = portfolio.slice(0, 4).map((p) => ({ id: p.id, nome: p.project_name || p.name, foto_url: p.file_url || PLACEHOLDER_IMG }));
    return {
      clientName: "Nome do Cliente",
      projectName: "Apartamento Exemplo",
      scopeDescription: "",
      servicesIncluded: "ambos",
      timelineBriefing: 4,
      timelineStudy: 15,
      timelineAnteprojeto: 20,
      timelineBudget: 7,
      timelinePriorities: 7,
      timelineConstruction: 25,
      timelineMobilization: 10,
      timelineFiscalization: 90,
      priceFull: 25000,
      priceCash: 23750,
      installmentsCount: 5,
      installmentEntry: 5000,
      installmentValue: 4000,
      priceNote: "",
      logoUrl: logos[0]?.file_url || undefined,
      founderPhotos,
      aboutText: aboutFromAssets || undefined,
      contactInstagram: instagram,
      contactPhone1: phone1,
      contactPhone2: phone2,
      ambientes: ["Sala", "Cozinha", "Suíte"],
      totalArea: 120,
      portfolioCards: cards.length
        ? cards
        : [
            { id: "ex1", nome: "Projeto Exemplo 1", foto_url: PLACEHOLDER_IMG },
            { id: "ex2", nome: "Projeto Exemplo 2", foto_url: PLACEHOLDER_IMG },
          ],
      validUntil,
    };
  }, [logos, founderPhotos, portfolio, contacts, aboutFromAssets]);

  const pages = useMemo(() => (draft ? buildProposalPages({ data: sampleProps, blocks: draft }) : []), [draft, sampleProps]);
  const pageKeys = useMemo(() => proposalPageKeys(pages), [pages]);
  const previewIndex = pageKeys.indexOf(previewKey);

  const selectBlock = (key: ProposalBlockKey) => {
    setExpanded((e) => (e === key ? null : key));
    setPreviewKey(key);
  };

  const goTo = (delta: number) => {
    const base = previewIndex >= 0 ? previewIndex : 0;
    const next = Math.max(0, Math.min(pages.length - 1, base + delta));
    if (pageKeys[next]) setPreviewKey(pageKeys[next]);
  };

  if (isLoading || !draft) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeCount = draft.filter((b) => b.is_active).length;
  const previewBlock = draft.find((b) => b.key === previewKey);
  const previewDef = previewBlock ? getBlockDefinition(previewBlock.key) : undefined;

  return (
    <div className="space-y-4">
      {/* Barra de ações */}
      <div className="flex flex-wrap items-center justify-between gap-3 sticky top-0 z-10 bg-background/95 backdrop-blur py-2 border-b">
        <div>
          <h3 className="font-semibold">Blocos do PDF da proposta</h3>
          <p className="text-xs text-muted-foreground">
            {activeCount} de {draft.length} blocos ativos · arraste para reordenar, use o interruptor para ligar/desligar e clique no nome para editar os textos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">Alterações não salvas</Badge>}
          <Button size="sm" variant="ghost" onClick={discard} disabled={!dirty || save.isPending}>
            <Undo2 className="h-4 w-4 mr-1" /> Descartar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!dirty || save.isPending}>
            <Save className="h-4 w-4 mr-1" /> {save.isPending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] gap-6 items-start">
        {/* Lista de blocos */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="proposal-blocks">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {draft.map((block, index) => {
                  const def = getBlockDefinition(block.key);
                  const isOpen = expanded === block.key;
                  return (
                    <Draggable key={block.key} draggableId={block.key} index={index}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={`border rounded-lg bg-background ${snapshot.isDragging ? "shadow-lg" : ""} ${!block.is_active ? "opacity-70" : ""} ${previewKey === block.key ? "border-primary" : ""}`}
                          data-testid={`block-${block.key}`}
                        >
                          <div className="flex items-center gap-3 p-2.5">
                            <span {...dragProvided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground/50" aria-label={`Arrastar ${block.label}`}>
                              <GripVertical className="h-4 w-4" />
                            </span>
                            <span className="w-6 text-xs text-muted-foreground tabular-nums">{index + 1}.</span>
                            <Switch
                              checked={block.is_active}
                              aria-label={`Ativar bloco ${block.label}`}
                              onCheckedChange={(v) => updateBlock(block.key, { is_active: v })}
                            />
                            <button
                              type="button"
                              className="flex-1 min-w-0 text-left"
                              onClick={() => selectBlock(block.key)}
                            >
                              <p className="text-sm font-medium truncate flex items-center gap-2">
                                {block.label}
                                {!block.is_active && <EyeOff className="h-3.5 w-3.5 text-muted-foreground" aria-label="Bloco desligado" />}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{def?.description}</p>
                            </button>
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => selectBlock(block.key)} aria-expanded={isOpen} aria-label={`Editar ${block.label}`}>
                              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>

                          {isOpen && (
                            <div className="border-t p-3 space-y-4 bg-muted/20">
                              {def?.condition && <p className="text-xs text-muted-foreground italic">{def.condition}</p>}
                              <div className="space-y-1">
                                <Label htmlFor={`block-${block.key}-label`} className="text-xs font-semibold">Nome do bloco (só no admin)</Label>
                                <Input
                                  id={`block-${block.key}-label`}
                                  value={block.label}
                                  className="h-8 text-sm"
                                  onChange={(e) => updateBlock(block.key, { label: e.target.value })}
                                />
                              </div>
                              <BlockFields
                                block={block}
                                imageSuggestions={founderPhotos.filter((p) => p.file_url).map((p) => ({ id: p.id, name: p.name, url: p.file_url! }))}
                                onChange={(content) => updateBlock(block.key, { content: content as unknown as ResolvedProposalBlock["content"] })}
                              />
                              <div className="flex justify-end">
                                <Button size="sm" variant="ghost" className="text-xs" onClick={() => resetBlock(block.key)}>
                                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restaurar padrão deste bloco
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Preview em tempo real */}
        <Card className="lg:sticky lg:top-14">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm">Preview</CardTitle>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-1">
                  {previewIndex >= 0 ? `Página ${previewIndex + 1} de ${pages.length}` : `${pages.length} página(s)`}
                </span>
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => goTo(-1)} disabled={previewIndex <= 0} aria-label="Página anterior">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => goTo(1)} disabled={previewIndex < 0 || previewIndex >= pages.length - 1} aria-label="Próxima página">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Dados de exemplo. O PDF gerado usa as mesmas páginas, com os dados da proposta.
            </p>
          </CardHeader>
          <CardContent>
            {previewIndex >= 0 ? (
              <ScaledPage page={pages[previewIndex]} />
            ) : (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground" data-testid="preview-empty">
                {previewBlock && !previewBlock.is_active
                  ? `O bloco "${previewBlock.label}" está desligado e não entra no PDF.`
                  : previewDef?.condition ?? "Este bloco não aparece com os dados de exemplo."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
