import { Mic, MicOff, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  /** Chamado com o texto final transcrito (append ou replace fica a cargo do consumidor). */
  onTranscript: (text: string) => void;
  /** Texto de tooltip opcional. */
  title?: string;
  className?: string;
  size?: "sm" | "default" | "icon";
}

/**
 * Botão compacto para ditado por voz via Web Speech API (pt-BR).
 * Usa o mesmo motor do VoiceChat/VoiceAgent mas pensado para ser embutido
 * ao lado de inputs/textareas em formulários — ex: diário de obra, tarefas.
 */
export function VoiceInputButton({
  onTranscript,
  title = "Ditar por voz",
  className,
  size = "icon",
}: VoiceInputButtonProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore — chamado depois de onend
      }
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const SR =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;

    let finalText = "";

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + " ";
        }
      }
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      const trimmed = finalText.trim();
      if (trimmed) onTranscript(trimmed);
    };

    recognition.onerror = (e: any) => {
      console.error("VoiceInputButton error:", e.error);
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [onTranscript]);

  const toggle = () => (listening ? stop() : start());

  if (!supported) {
    return (
      <Button
        type="button"
        variant="ghost"
        size={size}
        disabled
        title="Seu navegador não suporta ditado por voz (use Chrome ou Edge)"
        className={className}
      >
        <MicOff className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={listening ? "default" : "ghost"}
      size={size}
      onClick={toggle}
      title={listening ? "Parar gravação" : title}
      className={cn(listening && "bg-destructive text-destructive-foreground animate-pulse", className)}
    >
      {listening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}
