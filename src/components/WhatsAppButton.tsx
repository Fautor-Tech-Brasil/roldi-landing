import { MessageCircle } from "lucide-react";
import { contaContato } from "@/lib/contagem";

const WhatsAppButton = () => {
  const whatsappUrl =
    "https://wa.me/5548991061107?text=Ol%C3%A1!%20Gostaria%20de%20uma%20consultoria%20especializada%20em%20seguros%20com%20a%20ROLDI.";

  return (
    <a
      href={whatsappUrl}
      onClick={() => contaContato("whatsapp/botao")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco pelo WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] flex items-center justify-center shadow-lg whatsapp-pulse transition-colors duration-200"
    >
      <MessageCircle className="h-7 w-7 text-white" />
    </a>
  );
};

export default WhatsAppButton;
