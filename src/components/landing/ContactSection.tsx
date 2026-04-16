import { useState } from "react";
import { motion } from "framer-motion";
import { Instagram, Phone, Mail, MapPin, Loader2, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSiteLead, type SiteLeadPayload } from "@/hooks/useSiteLead";

const contacts = [
  { icon: Instagram, label: "@quadraarq", href: "https://instagram.com/quadraarq" },
  { icon: Phone, label: "(31) 97264-1970 · Camilla", href: "https://wa.me/5531972641970" },
  { icon: Phone, label: "(31) 91244-672 · Mariana", href: "https://wa.me/553191244672" },
  { icon: Mail, label: "contato@quadraarquitetura.com", href: "mailto:contato@quadraarquitetura.com" },
  { icon: MapPin, label: "Rua Euler, 10 · sala 301 · Padre Eustaquio · BH/MG", href: "https://maps.google.com/?q=Rua+Euler+10+Belo+Horizonte" },
];

export function ContactSection() {
  const { mutate: createLead, isPending } = useSiteLead();
  const [form, setForm] = useState<SiteLeadPayload>({
    name: "",
    email: "",
    phone: "",
    projectType: "residencial",
    message: "",
  });

  const isValid = form.name.trim() && form.email.trim() && form.phone.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    createLead(form, {
      onSuccess: () => {
        setForm({ name: "", email: "", phone: "", projectType: "residencial", message: "" });
      },
    });
  };

  return (
    <section id="contato" className="relative py-24 md:py-32 bg-[#1B2A4A] overflow-hidden">
      {/* Decorative */}
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
        style={{ background: "#C4756E" }}
      />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Left: text + contacts */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="lg:col-span-5"
          >
            <p
              className="text-xs mb-5"
              style={{
                color: "#C4756E",
                letterSpacing: "6px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 500,
              }}
            >
              VAMOS CONVERSAR
            </p>

            <h2
              className="mb-8"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
                color: "#F0DCC8",
                fontWeight: 300,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}
            >
              Pronto para criar
              <br />
              <em style={{ color: "#C4756E", fontStyle: "italic" }}>algo unico</em>?
            </h2>

            <div className="w-12 h-px bg-[#C4756E] mb-8" />

            <p
              className="mb-10"
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: "1rem",
                color: "#F0DCC8",
                opacity: 0.8,
                lineHeight: 1.8,
                fontWeight: 300,
              }}
            >
              Conta pra gente sobre o seu projeto. Retornamos em ate 48 horas uteis para
              marcar um bate-papo sem compromisso.
            </p>

            <ul className="space-y-4">
              {contacts.map((c) => {
                const Icon = c.icon;
                return (
                  <li key={c.label}>
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-4 text-[#F0DCC8]/80 hover:text-[#F0DCC8] transition-colors"
                    >
                      <span
                        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border border-[#C4756E]/40 transition-all group-hover:bg-[#C4756E] group-hover:border-[#C4756E]"
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.5} />
                      </span>
                      <span
                        className="leading-9"
                        style={{
                          fontFamily: "'Jost', sans-serif",
                          fontSize: "0.9375rem",
                          fontWeight: 300,
                        }}
                      >
                        {c.label}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          {/* Right: form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="lg:col-span-7"
          >
            <form
              onSubmit={handleSubmit}
              className="bg-[#F5E0D0] p-8 md:p-12"
              style={{ fontFamily: "'Jost', sans-serif" }}
            >
              <h3
                className="mb-8"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1.75rem",
                  color: "#1B2A4A",
                  fontWeight: 400,
                }}
              >
                Envie uma mensagem
              </h3>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="ln-name" className="text-xs uppercase tracking-widest text-[#1B2A4A]/70">
                    Nome *
                  </Label>
                  <Input
                    id="ln-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-2 bg-transparent border-0 border-b border-[#1B2A4A]/20 rounded-none focus-visible:ring-0 focus-visible:border-[#8B4557] px-0 text-[#1B2A4A]"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="ln-email" className="text-xs uppercase tracking-widest text-[#1B2A4A]/70">
                      Email *
                    </Label>
                    <Input
                      id="ln-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="mt-2 bg-transparent border-0 border-b border-[#1B2A4A]/20 rounded-none focus-visible:ring-0 focus-visible:border-[#8B4557] px-0 text-[#1B2A4A]"
                      placeholder="voce@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ln-phone" className="text-xs uppercase tracking-widest text-[#1B2A4A]/70">
                      Telefone *
                    </Label>
                    <Input
                      id="ln-phone"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="mt-2 bg-transparent border-0 border-b border-[#1B2A4A]/20 rounded-none focus-visible:ring-0 focus-visible:border-[#8B4557] px-0 text-[#1B2A4A]"
                      placeholder="(31) 90000-0000"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs uppercase tracking-widest text-[#1B2A4A]/70">
                    Tipo de projeto
                  </Label>
                  <Select
                    value={form.projectType}
                    onValueChange={(v) => setForm({ ...form, projectType: v as SiteLeadPayload["projectType"] })}
                  >
                    <SelectTrigger className="mt-2 bg-transparent border-0 border-b border-[#1B2A4A]/20 rounded-none px-0 text-[#1B2A4A] focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residencial">Residencial</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                      <SelectItem value="saude">Saude</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ln-message" className="text-xs uppercase tracking-widest text-[#1B2A4A]/70">
                    Mensagem
                  </Label>
                  <Textarea
                    id="ln-message"
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="mt-2 bg-transparent border-0 border-b border-[#1B2A4A]/20 rounded-none focus-visible:ring-0 focus-visible:border-[#8B4557] px-0 text-[#1B2A4A] resize-none"
                    placeholder="Conte um pouco sobre o seu projeto..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isValid || isPending}
                  className="group w-full md:w-auto bg-[#1B2A4A] text-[#F0DCC8] px-10 py-4 text-xs uppercase transition-all hover:bg-[#2d4373] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-3 mt-4"
                  style={{ letterSpacing: "3px", fontWeight: 500 }}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar mensagem
                      <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
