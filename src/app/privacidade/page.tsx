import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Política de Privacidade do HUB FDS com detalhes sobre coleta, uso e proteção de dados pessoais.",
  alternates: {
    canonical: "/privacidade",
  },
}

const sections = [
  {
    title: "1. Quais dados coletamos",
    items: [
      "Nome, e-mail, telefone e WhatsApp informados em formulários de contato ou agendamento.",
      "Dados de reserva, preferências de atendimento e informações necessárias para prestação do serviço.",
      "Dados técnicos de navegação, como IP, navegador, páginas acessadas e cookies essenciais.",
    ],
  },
  {
    title: "2. Como usamos os dados",
    items: [
      "Responder solicitações, confirmar agendamentos e prestar suporte ao cliente.",
      "Enviar comunicações operacionais, lembretes e informações relacionadas aos serviços contratados.",
      "Melhorar a experiência de navegação, segurança e desempenho do site.",
    ],
  },
  {
    title: "3. Compartilhamento",
    items: [
      "Podemos compartilhar dados com prestadores essenciais para funcionamento do site, pagamentos e atendimento.",
      "Não vendemos dados pessoais.",
      "Se houver obrigação legal ou regulatória, poderemos compartilhar informações com autoridades competentes.",
    ],
  },
  {
    title: "4. Armazenamento e segurança",
    items: [
      "Adotamos medidas razoáveis de segurança para proteger os dados contra acesso não autorizado, perda ou alteração.",
      "Mantemos os dados apenas pelo tempo necessário para cumprir as finalidades informadas ou exigências legais.",
    ],
  },
  {
    title: "5. Seus direitos",
    items: [
      "Você pode solicitar acesso, correção, atualização ou exclusão de dados, quando aplicável.",
      "Também pode pedir esclarecimentos sobre o uso das informações pessoais.",
      "Para exercer seus direitos, entre em contato pelos canais oficiais do HUB FDS.",
    ],
  },
]

export default function PrivacidadePage() {
  return (
    <main
      className="min-h-screen text-slate-900"
      style={{
        backgroundImage:
          "radial-gradient(circle at top, rgba(11, 61, 145, 0.12), transparent 34%), linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
      }}
    >
      <section className="border-b border-primary/10">
        <div className="container mx-auto px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 inline-flex rounded-full border border-primary/10 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary shadow-sm">
              Privacidade
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-primary sm:text-5xl lg:text-6xl">
              Política de Privacidade
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              Esta página explica como o HUB FDS coleta, utiliza e protege os dados pessoais enviados por visitantes,
              clientes e pessoas que utilizam nossos canais de contato e agendamento.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">Atualizado em 09/04/2026</span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">HUB FDS - Fábrica de Sonhos</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          {sections.map((section) => (
            <Card key={section.title} className="border-primary/10 bg-white/90 shadow-sm backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl text-slate-900">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm leading-7 text-slate-600 sm:text-base">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="border-primary/10 bg-primary text-white shadow-xl shadow-primary/10">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Canais de contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-white/80 sm:text-base">
              <p>
                Se você quiser corrigir, atualizar ou excluir seus dados pessoais, fale com nossa equipe pelos canais oficiais.
              </p>
              <p>
                O atendimento relacionado à privacidade pode ser direcionado pelo WhatsApp ou pela área de contato do site.
              </p>
              <div className="pt-2">
                <Button asChild className="rounded-xl bg-white px-6 font-bold text-primary hover:bg-white/90">
                  <Link href="/">Voltar para a home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900">Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-slate-600 sm:text-base">
              <p>
                Podemos atualizar esta política a qualquer momento para refletir mudanças operacionais, legais ou de tecnologia.
              </p>
              <p>
                O uso continuado do site após alterações representa concordância com a versão vigente do documento.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
