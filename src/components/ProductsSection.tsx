import { useState } from "react";
import {
  Home,
  Car,
  Building2,
  Truck,
  KeyRound,
  Building,
  Heart,
  Bike,
  Gauge,
  Plane,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Product = {
  icon: typeof Home;
  title: string;
  description: string;
  /** URL do formulário de cotação do Aggilizador (embed): só nos ramos ativos. */
  cotarUrl?: string;
};

const products: Product[] = [
  {
    icon: Home,
    title: "Seguro Residência",
    description: "Proteção completa para seu lar contra incêndio, roubo, danos elétricos e mais.",
    cotarUrl: "https://roldi.seucorretor.digital/#/formularios/residencial?simplificado=true",
  },
  {
    icon: Car,
    title: "Seguro Automóvel",
    description: "Cobertura sob medida para seu veículo com assistência 24h e preços competitivos.",
    cotarUrl: "https://roldi.seucorretor.digital/#/formularios/auto?simplificado=true",
  },
  {
    icon: Gauge,
    title: "Seguro Moto",
    description: "Segurança completa para motociclistas com assistência, roubo e colisão.",
    cotarUrl: "https://roldi.seucorretor.digital/#/formularios/moto?simplificado=true",
  },
  {
    icon: Bike,
    title: "Seguro Bike",
    description: "Cobertura para sua bicicleta contra roubo, furto, danos e acidentes pessoais.",
    cotarUrl: "https://roldi.seucorretor.digital/#/formularios/bike?simplificado=true",
  },
  {
    icon: Truck,
    title: "Seguro Caminhão",
    description: "Proteção para caminhões e cargas com assistência 24h e coberturas sob medida.",
    cotarUrl: "https://roldi.seucorretor.digital/#/formularios/caminhao?simplificado=true",
  },
  {
    icon: Building2,
    title: "Seguro Empresarial",
    description: "Blindagem do seu negócio contra riscos operacionais, patrimoniais e de responsabilidade.",
    cotarUrl: "https://roldi.seucorretor.digital/#/formularios/empresarial?simplificado=true",
  },
  {
    icon: Building,
    title: "Seguro Condomínio",
    description: "Cobertura obrigatória e complementar para condomínios residenciais e comerciais.",
    cotarUrl: "https://roldi.seucorretor.digital/#/formularios/condominio?simplificado=true",
  },
  {
    icon: Heart,
    title: "Seguro de Vida",
    description: "Proteção financeira para sua família com coberturas por morte, invalidez e doenças graves.",
    cotarUrl: "https://roldi.seucorretor.digital/#/formularios/vida?simplificado=true",
  },
  {
    icon: Plane,
    title: "Seguro Viagem",
    description: "Tranquilidade na viagem com cobertura médica, bagagem e imprevistos no Brasil e exterior.",
    cotarUrl: "https://roldi.seucorretor.digital/#/formularios/viagem?simplificado=true",
  },
  {
    icon: KeyRound,
    title: "Seguro Imobiliário",
    description: "Proteção para imóveis alugados, fiança locatícia e garantias para proprietários.",
  },
  {
    icon: Wallet,
    title: "Consórcio",
    description: "Planejamento inteligente para conquistar bens sem juros, com parcelas acessíveis.",
  },
];

const whatsappBase =
  "https://wa.me/5548991061107?text=Ol%C3%A1!%20Gostaria%20de%20uma%20consultoria%20especializada%20em%20";

const ProductsSection = () => {
  const [cotar, setCotar] = useState<Product | null>(null);

  return (
    <section id="produtos" className="py-20 md:py-28 bg-secondary">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 animate-on-scroll">
          <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">
            Nossos Produtos
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Soluções completas em{" "}
            <span className="text-gold">seguros</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {products.map((product, index) => (
            <div
              key={product.title}
              className="animate-on-scroll group relative bg-card rounded-lg border border-border p-7 hover:border-gold/40 hover:shadow-xl hover:shadow-gold/5 transition-all duration-300 hover:-translate-y-1 flex flex-col"
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-5 group-hover:bg-gold transition-colors duration-300">
                <product.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold text-card-foreground mb-2">
                {product.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5 flex-1">
                {product.description}
              </p>
              <div className="flex items-center justify-between gap-2">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="shrink-0 px-0 font-medium text-gold hover:bg-transparent hover:text-gold-light"
                >
                  <a
                    href={`${whatsappBase}${encodeURIComponent(product.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Saiba mais →
                  </a>
                </Button>
                {product.cotarUrl && (
                  <Button
                    size="sm"
                    onClick={() => setCotar(product)}
                    className="h-8 shrink-0 rounded-md bg-gold px-3 text-xs font-semibold text-gold-foreground shadow-sm shadow-gold/20 hover:bg-gold-light"
                  >
                    Solicitar Cotação
                  </Button>
                )}
              </div>
              {/* Gold accent bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gold rounded-b-lg scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!cotar} onOpenChange={(open) => !open && setCotar(null)}>
        <DialogContent className="max-w-3xl w-[95vw] p-0 gap-0 overflow-hidden flex flex-col h-[85vh]">
          <DialogHeader className="px-6 pt-5 pb-4 text-left shrink-0">
            <DialogTitle className="font-display text-xl">
              {cotar ? `Cotação de ${cotar.title.replace("Seguro ", "")}` : "Cotação"}
            </DialogTitle>
          </DialogHeader>
          {cotar && (
            <iframe
              src={cotar.cotarUrl}
              title={`Cotação de ${cotar.title}`}
              className="w-full flex-1 border-0 bg-white"
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ProductsSection;
