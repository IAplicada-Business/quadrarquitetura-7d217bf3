import { useState, useRef } from "react";
import { Sparkles, Mic, MicOff, ImagePlus, Loader2, X, Map, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getDisciplineColor } from "@/lib/disciplineColors";
import type { ProjectActivity } from "@/hooks/useProjectActivities";

interface GeneratedActivity {
  name: string;
  discipline: string;
  area_m2?: number;
  duration_days: number;
  description?: string;
  selected: boolean;
}

interface PlantAmbiente {
  nome: string;
  area_m2_estimada: number;
}

interface PlantActivity extends GeneratedActivity {
  ambiente_origem?: string;
  depends_on_activity_name?: string;
}

interface GenerateActivitiesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  existingCount: number;
  onCreate: (data: Partial<ProjectActivity>) => void;
}

export function GenerateActivitiesDialog({
  open,
  onOpenChange,
  projectId,
  existingCount,
  onCreate,
}: GenerateActivitiesDialogProps) {
  const [tab, setTab] = useState("texto");
  const [textInput, setTextInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedActivities, setGeneratedActivities] = useState<GeneratedActivity[] | null>(null);

  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const recognitionRef = useRef<any>(null);

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Plant state
  const [plantFile, setPlantFile] = useState<File | null>(null);
  const [plantPreview, setPlantPreview] = useState<string | null>(null);
  const [obraType, setObraType] = useState("reforma");
  const [ambientesInput, setAmbientesInput] = useState("");
  const [plantAmbientes, setPlantAmbientes] = useState<PlantAmbiente[] | null>(null);
  const [plantActivities, setPlantActivities] = useState<PlantActivity[] | null>(null);

  const resetState = () => {
    setTextInput("");
    setGeneratedActivities(null);
    setTranscription("");
    setImageFile(null);
    setImagePreview(null);
    setIsGenerating(false);
    setIsUploading(false);
    setTab("texto");
    setPlantFile(null);
    setPlantPreview(null);
    setObraType("reforma");
    setAmbientesInput("");
    setPlantAmbientes(null);
    setPlantActivities(null);
  };

  const handleClose = (v: boolean) => {
    if (!v) resetState();
    onOpenChange(v);
  };

  // ── Audio ──
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Navegador não suporta reconhecimento de voz", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript + " ";
      }
      setTranscription(text.trim());
      setTextInput(text.trim());
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast({ title: "Erro no reconhecimento de voz", variant: "destructive" });
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  // ── Image ──
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Imagem deve ter no máximo 10MB", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── Plant image ──
  const handlePlantSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Arquivo deve ter no máximo 20MB", variant: "destructive" });
      return;
    }
    setPlantFile(file);
    setPlantPreview(URL.createObjectURL(file));
  };

  // ── Generate (text/audio/photo) ──
  const handleGenerate = async () => {
    let mode: string;
    let content: string;

    if (tab === "foto") {
      if (!imageFile) {
        toast({ title: "Selecione uma imagem", variant: "destructive" });
        return;
      }
      setIsUploading(true);
      const ext = imageFile.name.split(".").pop() || "jpg";
      const path = `ai-activities/${projectId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(path, imageFile);
      setIsUploading(false);
      if (uploadError) {
        toast({ title: "Erro ao enviar imagem", description: uploadError.message, variant: "destructive" });
        return;
      }
      const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);
      mode = "image";
      content = urlData.publicUrl;
    } else {
      const text = tab === "audio" ? transcription : textInput;
      if (!text.trim()) {
        toast({ title: "Descreva o projeto para gerar atividades", variant: "destructive" });
        return;
      }
      mode = "text";
      content = text;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-activities", {
        body: { project_id: projectId, mode, content },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const activities = (data.activities || []).map((a: any) => ({ ...a, selected: true }));
      setGeneratedActivities(activities);

      if (activities.length === 0) {
        toast({ title: "Nenhuma atividade gerada. Tente descrever com mais detalhes." });
      }
    } catch (err: any) {
      toast({ title: "Erro ao gerar atividades", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Analyze Plant ──
  const handleAnalyzePlant = async () => {
    if (!plantFile) {
      toast({ title: "Selecione uma planta", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const ext = plantFile.name.split(".").pop() || "jpg";
    const path = `plants/${projectId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(path, plantFile);
    setIsUploading(false);

    if (uploadError) {
      toast({ title: "Erro ao enviar planta", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(path);

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-plant", {
        body: {
          file_url: urlData.publicUrl,
          mode: "activities",
          obra_type: obraType,
          ambientes: ambientesInput || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const ambientes = (data.ambientes || []) as PlantAmbiente[];
      const atividades = (data.atividades || []).map((a: any) => ({
        ...a,
        selected: true,
        duration_days: a.duration_days || 1,
      })) as PlantActivity[];

      setPlantAmbientes(ambientes);
      setPlantActivities(atividades);

      if (atividades.length === 0) {
        toast({ title: "Nenhuma atividade identificada na planta." });
      } else {
        toast({ title: `${ambientes.length} ambientes e ${atividades.length} atividades identificados.` });
      }
    } catch (err: any) {
      toast({ title: "Erro ao analisar planta", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Add selected (text/audio/photo) ──
  const handleAddSelected = () => {
    if (!generatedActivities) return;
    const selected = generatedActivities.filter((a) => a.selected);
    if (selected.length === 0) {
      toast({ title: "Selecione ao menos uma atividade" });
      return;
    }

    selected.forEach((a, i) => {
      onCreate({
        name: a.name,
        discipline: a.discipline,
        area_m2: a.area_m2 ?? null,
        duration_days: a.duration_days,
        description: a.description ?? null,
        status: "pendente",
        position: existingCount + i,
        progress_percent: 0,
      } as any);
    });

    toast({ title: `${selected.length} atividade(s) adicionada(s)` });
    handleClose(false);
  };

  // ── Import plant activities ──
  const handleImportPlant = () => {
    if (!plantActivities) return;
    const selected = plantActivities.filter((a) => a.selected);
    if (selected.length === 0) {
      toast({ title: "Selecione ao menos uma atividade" });
      return;
    }

    selected.forEach((a, i) => {
      onCreate({
        name: a.name,
        discipline: a.discipline,
        area_m2: a.area_m2 ?? null,
        duration_days: a.duration_days,
        description: a.ambiente_origem ? `Ambiente: ${a.ambiente_origem}` : null,
        status: "pendente",
        position: existingCount + i,
        progress_percent: 0,
      } as any);
    });

    toast({
      title: `${selected.length} atividades criadas da planta`,
      description: "Materiais serão calculados automaticamente para atividades com área definida.",
    });
    handleClose(false);
  };

  const toggleActivity = (idx: number) => {
    setGeneratedActivities((prev) =>
      prev?.map((a, i) => (i === idx ? { ...a, selected: !a.selected } : a)) ?? null
    );
  };

  const updateActivity = (idx: number, field: string, value: any) => {
    setGeneratedActivities((prev) =>
      prev?.map((a, i) => (i === idx ? { ...a, [field]: value } : a)) ?? null
    );
  };

  const togglePlantActivity = (idx: number) => {
    setPlantActivities((prev) =>
      prev?.map((a, i) => (i === idx ? { ...a, selected: !a.selected } : a)) ?? null
    );
  };

  const updatePlantActivity = (idx: number, field: string, value: any) => {
    setPlantActivities((prev) =>
      prev?.map((a, i) => (i === idx ? { ...a, [field]: value } : a)) ?? null
    );
  };

  const updatePlantAmbiente = (idx: number, field: string, value: any) => {
    setPlantAmbientes((prev) =>
      prev?.map((a, i) => (i === idx ? { ...a, [field]: value } : a)) ?? null
    );
  };

  const selectedCount = generatedActivities?.filter((a) => a.selected).length ?? 0;
  const selectedPlantCount = plantActivities?.filter((a) => a.selected).length ?? 0;

  // Check if we're showing plant results
  const showPlantResults = plantAmbientes !== null && plantActivities !== null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar Atividades com IA
          </DialogTitle>
        </DialogHeader>

        {/* Plant results view */}
        {showPlantResults ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {plantAmbientes!.length} ambientes e {plantActivities!.length} atividades identificados na planta.
              Edite e selecione os que deseja importar.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto">
              {/* Left: Ambientes */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  Ambientes Identificados
                </h4>
                <div className="space-y-1.5">
                  {plantAmbientes!.map((amb, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                      <Input
                        value={amb.nome}
                        onChange={(e) => updatePlantAmbiente(idx, "nome", e.target.value)}
                        className="h-7 text-sm flex-1"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <Input
                          type="number"
                          value={amb.area_m2_estimada}
                          onChange={(e) => updatePlantAmbiente(idx, "area_m2_estimada", parseFloat(e.target.value) || 0)}
                          className="h-7 w-20 text-sm"
                          step="0.1"
                        />
                        <span className="text-xs text-muted-foreground">m²</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Atividades */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  Atividades Sugeridas
                </h4>
                <div className="space-y-1.5">
                  {plantActivities!.map((activity, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 rounded-md border p-2 transition-colors ${
                        activity.selected ? "bg-background" : "bg-muted/30 opacity-60"
                      }`}
                    >
                      <Checkbox
                        checked={activity.selected}
                        onCheckedChange={() => togglePlantActivity(idx)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <Input
                          value={activity.name}
                          onChange={(e) => updatePlantActivity(idx, "name", e.target.value)}
                          className="h-7 text-xs font-medium"
                        />
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 border-0"
                            style={{
                              backgroundColor: getDisciplineColor(activity.discipline) + "20",
                              color: getDisciplineColor(activity.discipline),
                            }}
                          >
                            {activity.discipline}
                          </Badge>
                          {activity.area_m2 != null && (
                            <span className="text-[10px] text-muted-foreground">{activity.area_m2}m²</span>
                          )}
                          <div className="flex items-center gap-0.5">
                            <Input
                              type="number"
                              value={activity.duration_days}
                              onChange={(e) => updatePlantActivity(idx, "duration_days", parseInt(e.target.value) || 1)}
                              className="h-5 w-12 text-[10px] px-1"
                              min={1}
                            />
                            <span className="text-[10px] text-muted-foreground">d</span>
                          </div>
                          {activity.ambiente_origem && (
                            <span className="text-[10px] text-muted-foreground italic">{activity.ambiente_origem}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => { setPlantAmbientes(null); setPlantActivities(null); }}>
                Voltar
              </Button>
              <Button onClick={handleImportPlant} disabled={selectedPlantCount === 0}>
                Importar {selectedPlantCount} Selecionada{selectedPlantCount !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        ) : !generatedActivities ? (
          <div className="space-y-4">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full">
                <TabsTrigger value="texto" className="flex-1">Texto</TabsTrigger>
                <TabsTrigger value="audio" className="flex-1">Áudio</TabsTrigger>
                <TabsTrigger value="foto" className="flex-1">Foto</TabsTrigger>
                <TabsTrigger value="planta" className="flex-1">
                  <Map className="h-3.5 w-3.5 mr-1" />
                  Planta Baixa
                </TabsTrigger>
              </TabsList>

              <TabsContent value="texto" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Descreva o projeto para a IA gerar as atividades automaticamente.
                </p>
                <Textarea
                  placeholder="Ex: Reforma de sala e cozinha, 45m², cliente quer piso novo, pintura completa, nova iluminação e demolição de meia parede"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={5}
                />
              </TabsContent>

              <TabsContent value="audio" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Grave um áudio descrevendo o projeto. A transcrição será usada para gerar atividades.
                </p>
                <div className="flex flex-col items-center gap-3 py-4">
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="lg"
                    className="rounded-full h-16 w-16"
                    onClick={toggleRecording}
                  >
                    {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {isRecording ? "Gravando... clique para parar" : "Clique para gravar"}
                  </span>
                </div>
                {transcription && (
                  <div className="rounded-md border p-3 text-sm bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Transcrição:</p>
                    {transcription}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="foto" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Envie uma foto da planta ou do ambiente para a IA analisar e gerar atividades.
                </p>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="rounded-md max-h-48 object-contain mx-auto"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg py-8 cursor-pointer hover:bg-muted/30 transition-colors">
                    <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Clique para selecionar imagem</span>
                    <span className="text-xs text-muted-foreground mt-1">PNG ou JPG, até 10MB</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </TabsContent>

              <TabsContent value="planta" className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Envie a planta baixa do projeto. A IA identificará ambientes e gerará atividades com estimativas de área e duração.
                </p>

                {plantPreview ? (
                  <div className="relative">
                    <img
                      src={plantPreview}
                      alt="Planta"
                      className="rounded-md max-h-40 object-contain mx-auto"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => { setPlantFile(null); setPlantPreview(null); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg py-6 cursor-pointer hover:bg-muted/30 transition-colors">
                    <Map className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Clique para selecionar planta</span>
                    <span className="text-xs text-muted-foreground mt-1">PNG, JPG ou PDF, até 20MB</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,application/pdf"
                      className="hidden"
                      onChange={handlePlantSelect}
                    />
                  </label>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Tipo de obra</label>
                    <Select value={obraType} onValueChange={setObraType}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reforma">Reforma</SelectItem>
                        <SelectItem value="construção">Construção</SelectItem>
                        <SelectItem value="acabamento">Acabamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Ambientes (opcional)</label>
                    <Input
                      placeholder="Ex: Sala, Cozinha, Suíte"
                      value={ambientesInput}
                      onChange={(e) => setAmbientesInput(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {tab === "planta" ? (
              <Button
                className="w-full"
                onClick={handleAnalyzePlant}
                disabled={isGenerating || isUploading || !plantFile}
              >
                {isGenerating || isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isUploading ? "Enviando planta..." : "Analisando planta..."}
                  </>
                ) : (
                  <>
                    <Map className="h-4 w-4 mr-2" />
                    Analisar Planta e Gerar Atividades
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={handleGenerate}
                disabled={isGenerating || isUploading}
              >
                {isGenerating || isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isUploading ? "Enviando imagem..." : "Gerando atividades..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Lista
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {generatedActivities.length} atividades geradas. Edite e selecione as que deseja adicionar.
            </p>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {generatedActivities.map((activity, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 rounded-md border p-3 transition-colors ${
                    activity.selected ? "bg-background" : "bg-muted/30 opacity-60"
                  }`}
                >
                  <Checkbox
                    checked={activity.selected}
                    onCheckedChange={() => toggleActivity(idx)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <Input
                      value={activity.name}
                      onChange={(e) => updateActivity(idx, "name", e.target.value)}
                      className="h-8 text-sm font-medium"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-0"
                        style={{
                          backgroundColor: getDisciplineColor(activity.discipline) + "20",
                          color: getDisciplineColor(activity.discipline),
                        }}
                      >
                        {activity.discipline}
                      </Badge>
                      {activity.area_m2 != null && (
                        <span className="text-[11px] text-muted-foreground">{activity.area_m2} m²</span>
                      )}
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={activity.duration_days}
                          onChange={(e) => updateActivity(idx, "duration_days", parseInt(e.target.value) || 1)}
                          className="h-6 w-16 text-[11px] px-1.5"
                          min={1}
                        />
                        <span className="text-[11px] text-muted-foreground">dias</span>
                      </div>
                    </div>
                    {activity.description && (
                      <p className="text-[11px] text-muted-foreground truncate">{activity.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setGeneratedActivities(null)}>
                Voltar
              </Button>
              <Button onClick={handleAddSelected} disabled={selectedCount === 0}>
                Adicionar {selectedCount} Selecionada{selectedCount !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
