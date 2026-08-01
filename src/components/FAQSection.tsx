import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const faqData = {
  auto: {
    label: "Seguro Auto",
    items: [
      {
        question: "O que o seguro auto cobre?",
        answer:
          "Danos ao veículo, terceiros e assistências como guincho.",
      },
      {
        question: "O que é franquia e quando eu pago?",
        answer:
          "A franquia é o valor que o segurado paga em perdas parciais. Em perda total, roubo ou furto sem recuperação, a cobrança de franquia depende das condições da sua apólice: geralmente não se aplica, mas vale confirmar no seu contrato.",
      },
      {
        question: "Seguro mais barato vale a pena?",
        answer:
          "O ideal é analisar o custo-benefício, equilibrando preço, proteção e qualidade da seguradora.",
      },
      {
        question: "Posso transferir o seguro se trocar de carro?",
        answer:
          "Sim, através de uma substituição na apólice com ajuste de valor conforme o novo perfil.",
      },
      {
        question: "O seguro cobre enchente e eventos da natureza?",
        answer:
          "Depende da cobertura contratada: coberturas compreensivas/casco costumam incluir enchente e eventos da natureza. O corretor confirma exatamente o que está coberto na sua apólice antes da contratação.",
      },
    ],
  },
  residencial: {
    label: "Seguro Residencial",
    items: [
      {
        question: "Seguro residencial é só para quem tem casa própria?",
        answer:
          "Não. Inquilinos também podem contratar para proteger móveis, eletrodomésticos e responsabilidade civil.",
      },
      {
        question: "O que normalmente está coberto no seguro residencial?",
        answer:
          "Incêndio, explosão, danos elétricos, roubo, vendaval e assistências como chaveiro e encanador.",
      },
      {
        question: "Seguro residencial é caro?",
        answer:
          "Não. É um dos seguros com melhor custo-benefício, custando muitas vezes menos que um streaming mensal.",
      },
      {
        question: "Preciso fazer vistoria para contratar?",
        answer:
          "Na maioria dos casos não. O processo é simples, rápido e online.",
      },
      {
        question: "O seguro cobre equipamentos eletrônicos?",
        answer:
          "Sim, normalmente dentro da cobertura de conteúdo ou coberturas específicas.",
      },
    ],
  },
  empresarial: {
    label: "Seguro Empresarial",
    items: [
      {
        question: "O que o seguro empresarial protege?",
        answer:
          "Além do prédio, protege equipamentos, mercadorias, responsabilidade civil e lucros cessantes.",
      },
      {
        question: "O que é a cobertura de perda de faturamento?",
        answer:
          "É a cobertura de Lucros Cessantes, que protege o fluxo financeiro após um sinistro.",
      },
      {
        question: "Pequenas empresas precisam de seguro?",
        answer:
          "Sim. Elas são as mais vulneráveis financeiramente a sinistros inesperados.",
      },
      {
        question: "Posso personalizar o seguro conforme meu negócio?",
        answer:
          "Sim, o seguro é modular e ajustado conforme atividade e porte da empresa.",
      },
      {
        question: "O seguro ajuda na continuidade do negócio?",
        answer:
          "Sim, protege o patrimônio e a operação para que a empresa se recupere após eventos inesperados.",
      },
    ],
  },
  gerais: {
    label: "Dúvidas Gerais",
    items: [
      {
        question: "Como saber qual seguro é ideal para mim?",
        answer:
          "Através de uma análise personalizada considerando seu perfil, patrimônio e exposição a riscos.",
      },
      {
        question: "Posso parcelar o seguro?",
        answer:
          "Sim, na maioria das vezes via cartão de crédito ou boleto, conforme a seguradora.",
      },
      {
        question: "O que influencia no valor do seguro?",
        answer:
          "Perfil do segurado, localização, coberturas escolhidas e valor da franquia.",
      },
      {
        question: "Contratar seguro é burocrático?",
        answer:
          "Hoje não. O processo é rápido, simples e majoritariamente digital.",
      },
      {
        question: "Por que contratar com corretor e não direto?",
        answer:
          "O corretor faz a análise comparativa, garante a contratação correta e defende seus interesses em caso de sinistro.",
      },
    ],
  },
};

const categories = Object.keys(faqData) as (keyof typeof faqData)[];

const FAQSection = () => {
  return (
    <section id="faq" className="py-20 md:py-28 bg-primary">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 animate-on-scroll">
          <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">
            Dúvidas Frequentes
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground">
            Perguntas <span className="text-gold">frequentes</span>
          </h2>
        </div>

        <div className="max-w-3xl mx-auto animate-on-scroll">
          <Tabs defaultValue="auto" className="w-full">
            <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 bg-white/5 border border-white/10 rounded-lg p-1 h-auto gap-1">
              {categories.map((key) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="text-sm font-medium text-primary-foreground/60 py-3 rounded-md transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-gold data-[state=active]:border data-[state=active]:border-gold/30 data-[state=active]:shadow-lg data-[state=active]:shadow-gold/10"
                >
                  {faqData[key].label}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((key) => (
              <TabsContent key={key} value={key} className="mt-8">
                <Accordion type="single" collapsible className="space-y-3">
                  {faqData[key].items.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`${key}-${index}`}
                      className="bg-white/5 rounded-lg border border-white/10 px-6 data-[state=open]:border-gold/30 transition-colors"
                    >
                      <AccordionTrigger className="text-left font-display text-base md:text-lg font-medium text-primary-foreground hover:text-gold transition-colors py-5 hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-primary-foreground/70 leading-relaxed pb-5">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
