import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, User, Palette, Calculator, Tag, MessageSquare } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  const toggleTheme = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const placeholderSections = [
    { icon: Calculator, title: "Parâmetros de Cálculo", desc: "Custo por m², proporções do setor" },
    { icon: Tag, title: "Categorias de Fornecedores", desc: "Gerenciar categorias disponíveis" },
    { icon: MessageSquare, title: "Templates de Mensagem", desc: "Cobrança, comunicação com clientes" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold font-display mb-1">Configurações</h1>
      <p className="text-muted-foreground mb-8">Personalize o sistema</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-muted-foreground text-sm">E-mail</Label>
              <p className="font-medium">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label>Tema Escuro</Label>
                <p className="text-sm text-muted-foreground">
                  Alternar entre tema claro e escuro
                </p>
              </div>
              <Switch checked={darkMode} onCheckedChange={toggleTheme} />
            </div>
          </CardContent>
        </Card>

        {/* Placeholder sections */}
        {placeholderSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <section.icon className="h-5 w-5" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-6 text-muted-foreground">
                <Settings className="h-6 w-6 mb-2 opacity-40" />
                <p className="text-sm">{section.desc} — em breve</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
