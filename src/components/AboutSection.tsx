import { Users, Clock, Award, CheckCircle2 } from "lucide-react";
import diegoDuarte from "@/assets/diego-duarte.webp";

const stats = [
  { icon: Clock, value: "27 anos", label: "de experiência" },
  { icon: Users, value: "+800", label: "famílias protegidas" },
  { icon: Award, value: "SUSEP", label: "registro ativo" },
];

const AboutSection = () => {
  return (
    <section id="sobre" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text - appears second on mobile, first on desktop */}
          <div className="animate-on-scroll order-2 lg:order-1">
            <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">
              Sobre o Especialista
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Diego <span className="text-gold">Duarte</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Sou Diego Duarte e atuo no mercado de seguros há 27 anos, com
              experiência em quatro seguradoras, passando por diferentes áreas
              até chegar ao cargo de Superintendente Comercial da Região Sul.
              Sou corretor certificado, habilitado em todos os ramos, com
              registro ativo na SUSEP.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Meu trabalho é guiado por um propósito claro: simplificar o seguro
              para você. Com empatia e escuta ativa, transformo processos
              complexos em soluções práticas, seguras e alinhadas à sua
              realidade, porque seguro é, acima de tudo, cuidado, proteção e
              tranquilidade para pessoas, famílias e empresas.
            </p>
            <p className="text-foreground font-medium leading-relaxed mb-8 border-l-4 border-gold pl-4 italic">
              "Minha missão é proteger histórias e facilitar escolhas. Você não
              controla o futuro, mas pode se preparar e se proteger."
            </p>

            {/* Credentials */}
            <div className="space-y-3 mb-10">
              {[
                "Corretor certificado e habilitado em todos os ramos",
                "Registro ativo na SUSEP",
                "Ex-Superintendente Comercial, Região Sul",
                "27 anos de experiência no mercado segurador",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-gold shrink-0" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center p-4 rounded-lg bg-secondary">
                  <stat.icon className="h-5 w-5 text-gold mx-auto mb-2" />
                  <p className="font-display text-xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Photo - appears first on mobile, second on desktop */}
          <div className="animate-on-scroll order-1 lg:order-2">
            <div className="relative">
              <img
                src={diegoDuarte}
                alt="Diego Duarte - CEO ROLDI Seguros"
                className="w-full max-w-md mx-auto lg:max-w-none rounded-2xl shadow-lg object-cover aspect-[4/5]"
              />
              {/* Gold accent border */}
              <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-gold/30 rounded-2xl -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
