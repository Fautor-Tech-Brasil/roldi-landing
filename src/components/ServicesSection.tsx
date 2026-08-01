import { Heart, Scale, ShieldCheck, BarChart3 } from "lucide-react";

const services = [
  {
    icon: Heart,
    title: "Seguro de Vida Resgatável",
    description:
      "Proteção financeira com possibilidade de resgate. Pensado para cuidar do futuro da sua família, com um instrumento que também funciona como reserva.",
  },
  {
    icon: Scale,
    title: "Blindagem de Sucessão",
    description:
      "Planejamento sucessório inteligente para evitar inventário judicial e garantir a transferência eficiente do seu patrimônio.",
  },
  {
    icon: ShieldCheck,
    title: "Responsabilidade Civil (D&O/E&O)",
    description:
      "Proteção para executivos e profissionais contra riscos de responsabilização pessoal em suas atividades profissionais.",
  },
  {
    icon: BarChart3,
    title: "Consultoria de Riscos Corporativos",
    description:
      "Análise completa dos riscos empresariais com soluções personalizadas para blindar sua empresa e seus ativos.",
  },
];

const ServicesSection = () => {
  return (
    <section id="servicos" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 animate-on-scroll">
          <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">
            Nossos Serviços
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Soluções sob medida para seu <span className="text-gold">patrimônio</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="animate-on-scroll group relative bg-card rounded-lg border border-border p-8 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/5 transition-all duration-300 hover:-translate-y-1"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-lg bg-primary flex items-center justify-center mb-6 group-hover:bg-gold transition-colors duration-300">
                <service.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold text-card-foreground mb-3">
                {service.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {service.description}
              </p>
              {/* Gold accent bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gold rounded-b-lg scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
