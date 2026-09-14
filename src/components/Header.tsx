import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import roldiLogo from "@/assets/roldi-logo-nova.webp";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { label: "Quem Somos", href: "#quem-somos" },
    { label: "Produtos", href: "#produtos" },
    { label: "Vantagens", href: "#vantagens" },
    { label: "FAQ", href: "#faq" },
    { label: "Contato", href: "#contato" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-20 md:h-28">
          {/* Logo */}
          <a href="#" className="flex shrink-0 items-center">
            <img
              src={roldiLogo}
              alt="ROLDI Corretora de Seguros"
              width={667}
              height={240}
              className="h-16 md:h-12 lg:h-20 w-auto"
            />
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="whitespace-nowrap text-sm font-medium text-primary-foreground/80 hover:text-gold transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
            <Button
              asChild
              className="bg-gold hover:bg-gold-light text-gold-foreground font-semibold px-6 rounded-md"
            >
              <a href="#contato">Falar com Especialista</a>
            </Button>
          </nav>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-primary-foreground p-2"
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-primary border-t border-white/10 animate-fade-in-up">
          <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-base font-medium text-primary-foreground/80 hover:text-gold transition-colors py-2"
              >
                {link.label}
              </a>
            ))}
            <Button
              asChild
              className="bg-gold hover:bg-gold-light text-gold-foreground font-semibold w-full mt-2"
            >
              <a href="#contato" onClick={() => setIsMenuOpen(false)}>
                Falar com Especialista
              </a>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
