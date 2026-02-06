import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logoDark from "@/assets/logo-dark.png";
import carousel1 from "@/assets/carousel-1.jpg";
import carousel2 from "@/assets/carousel-2.jpg";
import carousel3 from "@/assets/carousel-3.jpg";

const slides = [
  { src: carousel1, label: "Residência" },
  { src: carousel2, label: "Clínica" },
  { src: carousel3, label: "Banheiro" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { signIn, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate("/dashboard", { replace: true });
  }, [session, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error("Erro ao entrar", { description: error.message });
    } else {
      toast.success("Bem-vindo(a)!");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Form */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-8 sm:px-16 lg:px-20 py-12">
        <div className="w-full max-w-md mx-auto">
          <img src={logoDark} alt="Quadra Arquitetura" className="h-16 mb-10" />

          <h2 className="text-2xl font-display font-bold mb-1">
            Bem-vindo(a) de volta
          </h2>
          <p className="text-muted-foreground mb-8">
            Acesse o sistema de gestão Quadra
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Carregando..." : "Entrar"}
            </Button>
          </form>
        </div>
      </div>

      {/* Right - Carousel */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-primary">
        {slides.map((slide, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: currentSlide === index ? 1 : 0 }}
          >
            <img
              src={slide.src}
              alt={slide.label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
          </div>
        ))}

        {/* Caption */}
        <div className="absolute bottom-12 left-10 right-10 z-10">
          <p className="text-primary-foreground/70 text-sm font-medium tracking-wider uppercase mb-2">
            Projeto
          </p>
          <p className="text-primary-foreground text-2xl font-display font-bold">
            {slides[currentSlide].label}
          </p>

          {/* Dots */}
          <div className="flex gap-2 mt-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === index
                    ? "w-8 bg-accent"
                    : "w-4 bg-primary-foreground/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
