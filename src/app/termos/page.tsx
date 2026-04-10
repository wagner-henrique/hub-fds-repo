import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const sections = [
  {
    title: "1. Uso dos serviços",
    items: [
      "Os espaços do HUB FDS devem ser utilizados de forma responsável, respeitando horários, regras de convivência e orientações da equipe.",
      "Reservas, visitas e atendimentos dependem de confirmação prévia e disponibilidade do espaço.",
      "Alguns serviços podem exigir cadastro, pagamento, assinatura ou validação adicional.",
    ],
  },
  {
    title: "2. Agendamentos e cancelamentos",
    items: [
      "As solicitações de agendamento estão sujeitas à disponibilidade de data, horário e espaço.",
      "Cancelamentos e reagendamentos podem seguir políticas específicas informadas no momento da contratação.",
      "O não comparecimento pode gerar perda da reserva ou cobrança conforme o serviço contratado.",
    ],
  },
  {
    title: "3. Conduta do usuário",
    items: [
      "Não é permitido usar o site ou os espaços para fins ilícitos, ofensivos, fraudulentos ou que violem direitos de terceiros.",
      "O usuário é responsável pelas informações que envia e pelo uso que faz das dependências e canais de atendimento.",
      "Qualquer dano causado a equipamentos, mobiliário ou infraestrutura pode ser cobrado do responsável.",
    ],
  },
  {
    title: "4. Pagamentos e faturamento",
    items: [
      "Quando aplicável, os valores, formas de pagamento e condições comerciais serão informados antes da confirmação do serviço.",
      "Podemos utilizar intermediadores de pagamento e sistemas de cobrança para processar transações.",
      "Em caso de divergência, a equipe poderá solicitar validação adicional antes da liberação do serviço.",
    ],
  },
  {
    title: "5. Responsabilidades do HUB FDS",
    items: [
      "Manter o site e os serviços em funcionamento com o melhor nível de disponibilidade possível.",
      "Prestar suporte razoável em relação às reservas, informações e atendimento ao cliente.",
      "Buscar corrigir falhas técnicas e atualizar as informações públicas sempre que necessário.",
    ],
  },
]

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(11,61,145,0.12),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] text-slate-900">
      <section className="border-b border-primary/10">
        <div className="container mx-auto px-4 py-14 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 inline-flex rounded-full border border-primary/10 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary shadow-sm">
              Termos de Uso
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-primary sm:text-5xl lg:text-6xl">
              Termos de Uso
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              Ao acessar o site e utilizar os serviços do HUB FDS, você concorda com as condições descritas nesta página.
              Estes termos ajudam a organizar o uso dos nossos canais, reservas e espaços.
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
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-primary/10 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900">Contato e suporte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-slate-600 sm:text-base">
              <p>
                Se houver dúvida sobre estes termos, fale com a equipe do HUB FDS antes de concluir qualquer contratação.
              </p>
              <p>
                Em casos de atendimento, reserva ou esclarecimento comercial, nossa equipe pode orientar o melhor canal.
              </p>
              <div className="pt-2">
                <Button asChild className="rounded-xl font-bold">
                  <Link href="/">Voltar para a home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-primary text-white shadow-xl shadow-primary/10">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Disposições finais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-white/80 sm:text-base">
              <p>
                O HUB FDS pode alterar estes termos a qualquer momento para refletir ajustes operacionais, legais ou comerciais.
              </p>
              <p>
                O uso contínuo do site ou dos serviços após alterações significa concordância com a versão atualizada.
              </p>
              <p>
                Caso exista conflito entre uma proposta comercial específica e estes termos, prevalece a condição informada na proposta ou contrato.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
