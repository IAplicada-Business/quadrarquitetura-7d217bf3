import { useState, useEffect, KeyboardEvent } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Sparkles, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { POST_TYPES, POST_STATUSES, POST_PLATFORMS, POST_TONES, STATUS_LABELS, TYPE_COLORS } from "@/hooks/useContentPosts";
import type { ContentPost } from "@/hooks/useContentPosts";
import type { ContentSeries } from "@/hooks/useContentSeries";

interface ContentPostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: ContentPost | null;
  series: ContentSeries[];
  onSave: (values: Partial<ContentPost>) => void;
  readOnly?: boolean;
  defaultDate?: string;
}

export default function ContentPostSheet({ open, onOpenChange, post, series, onSave, readOnly, defaultDate }: ContentPostSheetProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("feed");
  const [platform, setPlatform] = useState("instagram");
  const [status, setStatus] = useState("ideia");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [objective, setObjective] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("especialista");
  const [hook, setHook] = useState("");
  const [script, setScript] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [notes, setNotes] = useState("");
  const [seriesId, setSeriesId] = useState("");
  const [generating, setGenerating] = useState(false);

  // Sync form state when sheet opens with new data
  useEffect(() => {
    if (!open) return;
    setTitle(post?.title || "");
    setType(post?.type || "feed");
    setPlatform(post?.platform || "instagram");
    setStatus(post?.status || "ideia");
    setScheduledDate(
      post?.scheduled_date ? new Date(post.scheduled_date + "T12:00:00")
      : defaultDate ? new Date(defaultDate + "T12:00:00")
      : undefined
    );
    setObjective(post?.objective || "");
    setTargetAudience(post?.target_audience || "");
    setTone(post?.tone || "especialista");
    setHook(post?.hook || "");
    setScript(post?.script || "");
    setHashtags(post?.hashtags || []);
    setHashtagInput("");
    setNotes(post?.notes || "");
    setSeriesId(post?.series_id || "");
  }, [open, post?.id, defaultDate]);

  const resetForm = () => {
    setTitle("");
    setType("feed");
    setPlatform("instagram");
    setStatus("ideia");
    setScheduledDate(undefined);
    setObjective("");
    setTargetAudience("");
    setTone("especialista");
    setHook("");
    setScript("");
    setHashtags([]);
    setHashtagInput("");
    setNotes("");
    setSeriesId("");
  };

  const handleHashtagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && hashtagInput.trim()) {
      e.preventDefault();
      const tag = hashtagInput.trim().startsWith("#") ? hashtagInput.trim() : `#${hashtagInput.trim()}`;
      if (!hashtags.includes(tag)) setHashtags([...hashtags, tag]);
      setHashtagInput("");
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Não autenticado");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/content-ai-assistant`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "generate_script",
            objective,
            type,
            platform,
            target_audience: targetAudience,
            tone,
          }),
        }
      );
      if (!res.ok) throw new Error("Erro ao gerar roteiro");
      const result = await res.json();
      if (result.hook) setHook(result.hook);
      if (result.script) setScript(result.script);
      if (result.hashtags) setHashtags(result.hashtags);
      toast({ title: "Roteiro gerado com IA!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    onSave({
      ...(post?.id ? { id: post.id } : {}),
      title,
      type,
      platform,
      status,
      scheduled_date: scheduledDate ? format(scheduledDate, "yyyy-MM-dd") : null,
      objective: objective || null,
      hook: hook || null,
      script: script || null,
      hashtags,
      notes: notes || null,
      series_id: seriesId || null,
      target_audience: targetAudience || null,
      tone: tone || null,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{readOnly ? "Visualizar Post" : post?.id ? "Editar Post" : "Novo Post"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={readOnly} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo *</Label>
              <Select value={type} onValueChange={setType} disabled={readOnly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POST_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[t] }} />
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plataforma</Label>
              <Select value={platform} onValueChange={setPlatform} disabled={readOnly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POST_PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus} disabled={readOnly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POST_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Série</Label>
              <Select value={seriesId} onValueChange={setSeriesId} disabled={readOnly}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {series.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Data planejada</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left" disabled={readOnly}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledDate ? format(scheduledDate, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} locale={ptBR} />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Objetivo *</Label>
            <Textarea value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="O que quero comunicar com este post?" disabled={readOnly} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Público-alvo</Label>
              <Input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Quem vai ver isso?" disabled={readOnly} />
            </div>
            <div>
              <Label>Tom</Label>
              <Select value={tone} onValueChange={setTone} disabled={readOnly}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POST_TONES.map((t) => (
                    <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!readOnly && (
            <Button onClick={handleGenerate} disabled={generating} variant="outline" className="w-full">
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Gerar com IA
            </Button>
          )}

          <div>
            <Label>Hook (abertura)</Label>
            <Textarea value={hook} onChange={(e) => setHook(e.target.value)} placeholder="Primeiros 3 segundos / primeira frase" rows={2} disabled={readOnly} />
          </div>

          <div>
            <Label>Roteiro completo</Label>
            <Textarea value={script} onChange={(e) => setScript(e.target.value)} placeholder="Roteiro em cenas/tópicos..." rows={8} disabled={readOnly} />
          </div>

          <div>
            <Label>Hashtags</Label>
            {!readOnly && (
              <Input
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={handleHashtagKeyDown}
                placeholder="Digite e pressione Enter"
                className="mb-2"
              />
            )}
            <div className="flex flex-wrap gap-1">
              {hashtags.map((h, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {h}
                  {!readOnly && (
                    <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setHashtags(hashtags.filter((_, j) => j !== i))} />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Notas internas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} disabled={readOnly} />
          </div>

          {!readOnly && (
            <Button onClick={handleSave} className="w-full">
              {post?.id ? "Salvar alterações" : "Criar post"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
