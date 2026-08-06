import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  need: string;
  message?: string;
  /** Honeypot: fica escondido no formulário; se vier preenchido, o servidor descarta. */
  website?: string;
}

const emptyForm: ContactFormData = {
  name: "",
  email: "",
  phone: "",
  need: "",
  message: "",
  website: "",
};

/** Lógica do formulário de contato: mesma origem (/api/contact) → Resend (ADR-0008). */
export function useContactForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>(emptyForm);

  const set = <K extends keyof ContactFormData>(key: K, value: ContactFormData[K]) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error(`Falha no envio (HTTP ${response.status})`);
      toast({
        title: "Mensagem enviada!",
        description: "Entraremos em contato em breve. Obrigado pelo seu interesse.",
      });
      setFormData(emptyForm);
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente ou entre em contato pelo WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { formData, set, handleSubmit, isSubmitting };
}
