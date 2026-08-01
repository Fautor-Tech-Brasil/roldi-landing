interface Partner {
  name: string;
  fontStyle: string;
}

const partners: Partner[] = [
  { name: "Allianz", fontStyle: "font-sans font-bold tracking-widest uppercase text-lg" },
  { name: "Tokio Marine", fontStyle: "font-serif font-bold tracking-wide text-lg" },
  { name: "Porto Seguro", fontStyle: "font-sans font-semibold tracking-normal text-lg" },
  { name: "Bradesco Seguros", fontStyle: "font-sans font-medium italic text-base" },
  { name: "HDI Seguros", fontStyle: "font-sans font-bold uppercase tracking-wider text-lg" },
  { name: "Prudential", fontStyle: "font-serif font-bold tracking-wide text-lg" },
  { name: "SulAmérica", fontStyle: "font-display font-bold text-lg" },
  { name: "Yelum Seguros", fontStyle: "font-display font-bold text-lg" },
];

const PartnerLogo = ({ partner, className = "" }: { partner: Partner; className?: string }) => {
  return (
    <span className={`${partner.fontStyle} text-primary-foreground/80 group-hover:text-primary-foreground transition-all duration-300 text-center leading-tight ${className}`}>
      {partner.name}
    </span>
  );
};

const SocialProof = () => {
  const marqueeItems = [...partners, ...partners];

  return (
    <section className="py-16 md:py-20 bg-[hsl(0_0%_3%)] border-y border-white/5 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header: Counter centered */}
        <div className="text-center mb-14">
          <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-2">
            Parceiros Estratégicos
          </p>
          <p className="font-display text-4xl md:text-5xl font-bold text-primary-foreground">
            +R$ <span className="text-gold">500 milhões</span>
          </p>
          <p className="text-primary-foreground/50 text-sm mt-2">
            em patrimônio protegido pelos nossos clientes
          </p>
        </div>
      </div>

      {/* Infinite Marquee: hidden on mobile */}
      <div className="relative hidden md:block">
        <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-[hsl(0_0%_3%)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-[hsl(0_0%_3%)] to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee">
          {marqueeItems.map((partner, index) => (
            <div
              key={`${partner.name}-${index}`}
              className="flex-shrink-0 mx-6 md:mx-10 group"
            >
              <div className="w-40 h-24 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl flex items-center justify-center p-4 group-hover:border-gold/30 group-hover:bg-white/10 group-hover:shadow-lg group-hover:shadow-gold/5 transition-all duration-300">
                <PartnerLogo partner={partner} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Grid */}
      <div className="container mx-auto px-4 md:px-6 mt-10 md:hidden">
        <div className="grid grid-cols-2 gap-4">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl flex items-center justify-center p-5 h-20 group"
            >
              <PartnerLogo partner={partner} className="text-sm" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
