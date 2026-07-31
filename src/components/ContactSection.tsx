import { MapPin, Mail, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContactForm } from "@/hooks/useContactForm";

const contactInfo = [
  {
    icon: MapPin,
    title: "Endereço",
    lines: ["Rua Afonso Pena, 564", "Florianópolis - SC"],
  },
  {
    icon: Mail,
    title: "E-mail",
    lines: ["contato@roldiseguros.com.br", "diego@roldiseguros.com.br"],
  },
  {
    icon: Phone,
    title: "Telefone / WhatsApp",
    lines: ["(48) 99106-1107"],
  },
];

const ContactSection = () => {
  const { formData, set, handleSubmit, isSubmitting } = useContactForm();

  return (
    <section id="contato" className="py-20 md:py-28 bg-primary">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div className="animate-on-scroll">
            <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">
              Contato
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Fale com a <span className="text-gold">ROLDI</span>
            </h2>
            <p className="text-primary-foreground/70 mb-10 max-w-md">
              Conte o que você precisa proteger. Respondemos rápido, sem enrolação.
            </p>
            <div className="space-y-6">
              {contactInfo.map((info) => (
                <div key={info.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-none">
                    <info.icon className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <div className="font-display font-semibold text-primary-foreground">
                      {info.title}
                    </div>
                    {info.lines.map((line) => (
                      <div key={line} className="text-sm text-primary-foreground/60">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-on-scroll rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="contact-name" className="text-primary-foreground">
                  Nome completo
                </Label>
                <Input
                  id="contact-name"
                  required
                  value={formData.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Seu nome"
                  className="mt-1.5 bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:border-gold focus-visible:ring-gold"
                />
              </div>
              <div>
                <Label htmlFor="contact-email" className="text-primary-foreground">
                  E-mail
                </Label>
                <Input
                  id="contact-email"
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="seu@email.com"
                  className="mt-1.5 bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:border-gold focus-visible:ring-gold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact-phone" className="text-primary-foreground">
                    Telefone
                  </Label>
                  <Input
                    id="contact-phone"
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="(48) 99999-9999"
                    className="mt-1.5 bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:border-gold focus-visible:ring-gold"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-need" className="text-primary-foreground">
                    Necessidade
                  </Label>
                  <Select value={formData.need} onValueChange={(v) => set("need", v)}>
                    <SelectTrigger
                      id="contact-need"
                      className="mt-1.5 bg-white/10 border-white/20 text-primary-foreground focus:border-gold focus:ring-gold"
                    >
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residencia">Seguro Residência</SelectItem>
                      <SelectItem value="auto">Seguro Automóvel</SelectItem>
                      <SelectItem value="empresarial">Seguro Empresarial</SelectItem>
                      <SelectItem value="vida">Seguro de Vida</SelectItem>
                      <SelectItem value="condominio">Seguro Condomínio</SelectItem>
                      <SelectItem value="consorcio">Consórcio</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gold hover:bg-gold-light text-gold-foreground font-semibold py-6 rounded-md shadow-lg shadow-gold/20"
              >
                {isSubmitting ? (
                  "Enviando..."
                ) : (
                  <>
                    Enviar Mensagem
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
