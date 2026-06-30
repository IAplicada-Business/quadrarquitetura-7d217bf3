// Sprint 4d (item 15b) — Análise comparativa de Instagrams.
// Mariana (vídeo 15): "ficou faltando aquele ponto onde você faria
// análise comparando os Instagrams que a gente mandou pra você".
//
// Métricas são input manual (sem integração com API do IG). Tela
// dividida em: perfis cadastrados (Quadra + referências), métricas
// mensais por perfil e comparativo lado a lado.
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Instagram, BarChart3 } from "lucide-react";
import { useInstagramAnalysis, type InstagramProfile, type InstagramMetric } from "@/hooks/useInstagramAnalysis";

function fmtMonth(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}
function fmtNumber(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("pt-BR").format(n);
}
function fmtPct(n: number | null | undefined) {
  if (n == null) return "—";
  return `${n.toFixed(2)}%`;
}

export default function ContentInstagram() {
  const {
    profiles, metrics, isLoading,
    createProfile, updateProfile, removeProfile,
    createMetric, updateMetric, removeMetric,
  } = useInstagramAnalysis();

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<InstagramProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState<{
    handle: string;
    label: string;
    kind: "self" | "reference";
    notes: string;
    is_active: boolean;
  }>({ handle: "", label: "", kind: "reference", notes: "", is_active: true });

  const [metricDialogOpen, setMetricDialogOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<InstagramMetric | null>(null);
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const [metricDraft, setMetricDraft] = useState<Partial<InstagramMetric>>({
    profile_id: "",
    period_start: firstOfMonth,
    period_end: todayIso,
  });

  // === Perfis ===
  const openCreateProfile = () => {
    setEditingProfile(null);
    setProfileDraft({ handle: "", label: "", kind: "reference", notes: "", is_active: true });
    setProfileDialogOpen(true);
  };
  const openEditProfile = (p: InstagramProfile) => {
    setEditingProfile(p);
    setProfileDraft({
      handle: p.handle,
      label: p.label ?? "",
      kind: (p.kind as "self" | "reference") ?? "reference",
      notes: p.notes ?? "",
      is_active: p.is_active,
    });
    setProfileDialogOpen(true);
  };
  const saveProfile = () => {
    if (!profileDraft.handle.trim()) return;
    const handle = profileDraft.handle.startsWith("@")
      ? profileDraft.handle.slice(1).trim()
      : profileDraft.handle.trim();
    const payload = {
      handle,
      label: profileDraft.label.trim() || null,
      kind: profileDraft.kind,
      notes: profileDraft.notes.trim() || null,
      is_active: profileDraft.is_active,
    };
    if (editingProfile) {
      updateProfile.mutate({ id: editingProfile.id, ...payload }, {
        onSuccess: () => setProfileDialogOpen(false),
      });
    } else {
      createProfile.mutate(payload, { onSuccess: () => setProfileDialogOpen(false) });
    }
  };

  // === Métricas ===
  const openCreateMetric = (profileId?: string) => {
    setEditingMetric(null);
    setMetricDraft({
      profile_id: profileId ?? profiles[0]?.id ?? "",
      period_start: firstOfMonth,
      period_end: todayIso,
    });
    setMetricDialogOpen(true);
  };
  const openEditMetric = (m: InstagramMetric) => {
    setEditingMetric(m);
    setMetricDraft({ ...m });
    setMetricDialogOpen(true);
  };
  const saveMetric = () => {
    const d = metricDraft;
    if (!d.profile_id || !d.period_start || !d.period_end) return;
    const payload = {
      profile_id: d.profile_id!,
      period_start: d.period_start!,
      period_end: d.period_end!,
      followers: d.followers ?? null,
      post_count: d.post_count ?? null,
      reel_count: d.reel_count ?? null,
      story_count: d.story_count ?? null,
      avg_likes: d.avg_likes ?? null,
      avg_comments: d.avg_comments ?? null,
      avg_reach: d.avg_reach ?? null,
      avg_saves: d.avg_saves ?? null,
      engagement_rate: d.engagement_rate ?? null,
      palette_dominant: d.palette_dominant ?? null,
      palette_secondary: d.palette_secondary ?? null,
      palette_tertiary: d.palette_tertiary ?? null,
      palette_quaternary: d.palette_quaternary ?? null,
      notes: d.notes ?? null,
    };
    if (editingMetric) {
      updateMetric.mutate({ id: editingMetric.id, ...payload }, {
        onSuccess: () => setMetricDialogOpen(false),
      });
    } else {
      createMetric.mutate(payload, { onSuccess: () => setMetricDialogOpen(false) });
    }
  };

  const profilesById = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  // === Comparativo (último período registrado por perfil) ===
  const latestByProfile = useMemo(() => {
    const map = new Map<string, InstagramMetric>();
    for (const m of metrics) {
      const cur = map.get(m.profile_id);
      if (!cur || m.period_start > cur.period_start) map.set(m.profile_id, m);
    }
    return profiles
      .filter((p) => p.is_active && map.has(p.id))
      .map((p) => ({ profile: p, metric: map.get(p.id)! }));
  }, [metrics, profiles]);

  const setMetricField = (field: keyof InstagramMetric, value: any) =>
    setMetricDraft((d) => ({ ...d, [field]: value }));

  return (
    <div className="space-y-6 p-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-playfair">Análise de Instagrams</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comparação manual de perfis de referência. Cadastre os perfis (Quadra + referências) e
            registre métricas mensais para comparar engajamento, frequência e paleta.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Carregando…</div>
      ) : (
        <Tabs defaultValue="comparativo">
          <TabsList>
            <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
            <TabsTrigger value="perfis">Perfis ({profiles.length})</TabsTrigger>
            <TabsTrigger value="metricas">Métricas ({metrics.length})</TabsTrigger>
          </TabsList>

          {/* === Comparativo === */}
          <TabsContent value="comparativo" className="mt-4 space-y-4">
            {latestByProfile.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Cadastre perfis e adicione métricas para ver o comparativo.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Último período registrado por perfil
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background">Métrica</TableHead>
                        {latestByProfile.map(({ profile, metric }) => (
                          <TableHead key={profile.id} className="min-w-[160px]">
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground flex items-center gap-1.5">
                                @{profile.handle}
                                {profile.kind === "self" && (
                                  <Badge variant="secondary" className="text-[9px]">Quadra</Badge>
                                )}
                              </span>
                              <span className="text-[10px] font-normal">
                                {fmtMonth(metric.period_start)} → {fmtMonth(metric.period_end)}
                              </span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { label: "Seguidores", key: "followers" as const, fmt: fmtNumber },
                        { label: "Posts no período", key: "post_count" as const, fmt: fmtNumber },
                        { label: "Reels no período", key: "reel_count" as const, fmt: fmtNumber },
                        { label: "Stories no período", key: "story_count" as const, fmt: fmtNumber },
                        { label: "Média de likes", key: "avg_likes" as const, fmt: fmtNumber },
                        { label: "Média de comentários", key: "avg_comments" as const, fmt: fmtNumber },
                        { label: "Média de alcance", key: "avg_reach" as const, fmt: fmtNumber },
                        { label: "Média de saves", key: "avg_saves" as const, fmt: fmtNumber },
                        { label: "Engagement rate", key: "engagement_rate" as const, fmt: fmtPct },
                      ].map((row) => (
                        <TableRow key={row.key}>
                          <TableCell className="sticky left-0 bg-background font-medium text-xs">
                            {row.label}
                          </TableCell>
                          {latestByProfile.map(({ profile, metric }) => (
                            <TableCell key={profile.id} className="text-xs">
                              {row.fmt((metric as any)[row.key])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="sticky left-0 bg-background font-medium text-xs">
                          Paleta
                        </TableCell>
                        {latestByProfile.map(({ profile, metric }) => {
                          const palette = [
                            metric.palette_dominant, metric.palette_secondary,
                            metric.palette_tertiary, metric.palette_quaternary,
                          ].filter(Boolean) as string[];
                          return (
                            <TableCell key={profile.id} className="text-xs">
                              {palette.length === 0 ? "—" : (
                                <div className="flex gap-1">
                                  {palette.map((c, i) => (
                                    <div
                                      key={i}
                                      title={c}
                                      className="h-4 w-4 rounded border"
                                      style={{ background: c }}
                                    />
                                  ))}
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* === Perfis === */}
          <TabsContent value="perfis" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={openCreateProfile}>
                <Plus className="h-4 w-4 mr-1" /> Novo Perfil
              </Button>
            </div>
            {profiles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum perfil cadastrado.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Handle</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Rótulo</TableHead>
                        <TableHead>Ativo</TableHead>
                        <TableHead className="w-28" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium flex items-center gap-1.5">
                            <Instagram className="h-3.5 w-3.5 text-muted-foreground" />
                            @{p.handle}
                          </TableCell>
                          <TableCell>
                            <Badge variant={p.kind === "self" ? "default" : "outline"} className="text-[10px]">
                              {p.kind === "self" ? "Quadra" : "Referência"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p.label || "—"}</TableCell>
                          <TableCell className="text-xs">{p.is_active ? "Sim" : "Não"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openCreateMetric(p.id)} title="Adicionar métricas">
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditProfile(p)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeProfile.mutate(p.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* === Métricas === */}
          <TabsContent value="metricas" className="mt-4 space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openCreateMetric()} disabled={profiles.length === 0}>
                <Plus className="h-4 w-4 mr-1" /> Nova Métrica
              </Button>
            </div>
            {metrics.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Cadastre métricas por perfil e período (mensal recomendado).
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Perfil</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Seguidores</TableHead>
                        <TableHead>Posts</TableHead>
                        <TableHead>Reels</TableHead>
                        <TableHead>Likes méd.</TableHead>
                        <TableHead>Coment. méd.</TableHead>
                        <TableHead>Engagement</TableHead>
                        <TableHead className="w-24" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="text-xs font-medium">@{profilesById[m.profile_id]?.handle ?? "—"}</TableCell>
                          <TableCell className="text-xs">{fmtMonth(m.period_start)} → {fmtMonth(m.period_end)}</TableCell>
                          <TableCell className="text-xs">{fmtNumber(m.followers)}</TableCell>
                          <TableCell className="text-xs">{fmtNumber(m.post_count)}</TableCell>
                          <TableCell className="text-xs">{fmtNumber(m.reel_count)}</TableCell>
                          <TableCell className="text-xs">{fmtNumber(m.avg_likes)}</TableCell>
                          <TableCell className="text-xs">{fmtNumber(m.avg_comments)}</TableCell>
                          <TableCell className="text-xs">{fmtPct(m.engagement_rate)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditMetric(m)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeMetric.mutate(m.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Dialog Perfil */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProfile ? "Editar Perfil" : "Novo Perfil"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_180px] gap-3">
              <div>
                <Label>Handle *</Label>
                <Input
                  placeholder="ex: quadrarq"
                  value={profileDraft.handle}
                  onChange={(e) => setProfileDraft((d) => ({ ...d, handle: e.target.value }))}
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={profileDraft.kind} onValueChange={(v) => setProfileDraft((d) => ({ ...d, kind: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Quadra (nosso)</SelectItem>
                    <SelectItem value="reference">Referência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Rótulo (opcional)</Label>
              <Input
                placeholder="Ex: Concorrente direta, Inspiração de paleta"
                value={profileDraft.label}
                onChange={(e) => setProfileDraft((d) => ({ ...d, label: e.target.value }))}
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                rows={3}
                value={profileDraft.notes}
                onChange={(e) => setProfileDraft((d) => ({ ...d, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveProfile} disabled={!profileDraft.handle.trim()}>
              {editingProfile ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Métricas */}
      <Dialog open={metricDialogOpen} onOpenChange={setMetricDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMetric ? "Editar Métricas" : "Novas Métricas"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Perfil *</Label>
                <Select
                  value={(metricDraft.profile_id as string) ?? ""}
                  onValueChange={(v) => setMetricField("profile_id", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>@{p.handle}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Início *</Label>
                <Input
                  type="date"
                  value={(metricDraft.period_start as string) ?? ""}
                  onChange={(e) => setMetricField("period_start", e.target.value)}
                />
              </div>
              <div>
                <Label>Fim *</Label>
                <Input
                  type="date"
                  value={(metricDraft.period_end as string) ?? ""}
                  onChange={(e) => setMetricField("period_end", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Seguidores", key: "followers" as const },
                { label: "Posts", key: "post_count" as const },
                { label: "Reels", key: "reel_count" as const },
                { label: "Stories", key: "story_count" as const },
                { label: "Likes méd.", key: "avg_likes" as const },
                { label: "Coment. méd.", key: "avg_comments" as const },
                { label: "Alcance méd.", key: "avg_reach" as const },
                { label: "Saves méd.", key: "avg_saves" as const },
                { label: "Engagement %", key: "engagement_rate" as const },
              ].map((f) => (
                <div key={f.key}>
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={(metricDraft[f.key] as number | null) ?? ""}
                    onChange={(e) =>
                      setMetricField(f.key, e.target.value === "" ? null : parseFloat(e.target.value))
                    }
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Cor dominante", key: "palette_dominant" as const },
                { label: "Cor secundária", key: "palette_secondary" as const },
                { label: "Cor terciária", key: "palette_tertiary" as const },
                { label: "Cor 4", key: "palette_quaternary" as const },
              ].map((f) => (
                <div key={f.key}>
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    placeholder="#A1B2C3 ou bege"
                    value={(metricDraft[f.key] as string | null) ?? ""}
                    onChange={(e) => setMetricField(f.key, e.target.value || null)}
                  />
                </div>
              ))}
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                rows={2}
                value={(metricDraft.notes as string | null) ?? ""}
                onChange={(e) => setMetricField("notes", e.target.value || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMetricDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={saveMetric}
              disabled={!metricDraft.profile_id || !metricDraft.period_start || !metricDraft.period_end}
            >
              {editingMetric ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
