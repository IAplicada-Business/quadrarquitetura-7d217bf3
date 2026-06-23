// Sprint 7d — botão "Instalar app" que aparece quando o navegador
// dispara `beforeinstallprompt` (Chrome/Edge desktop e Android). No
// iOS o Safari não dispara o evento; nesse caso mostramos uma dica
// estática com instruções "Compartilhar → Adicionar à tela de início".
import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPwaButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBefore = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBefore);
    window.addEventListener("appinstalled", onInstalled);

    // Já rodando em modo standalone? Esconde.
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBefore);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !deferred) return null;

  return (
    <button
      onClick={async () => {
        await deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
      }}
      className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-accent/15 text-accent hover:bg-accent/25 text-xs font-medium transition-colors"
      title="Instalar Quadra como aplicativo no seu dispositivo"
    >
      <Download className="h-3.5 w-3.5" />
      Instalar app
    </button>
  );
}
