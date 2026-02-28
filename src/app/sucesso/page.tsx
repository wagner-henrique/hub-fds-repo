import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900">Reserva Confirmada!</h1>
        
        <p className="text-muted-foreground">
          Seu pagamento foi processado com sucesso. Você receberá os detalhes da sua reserva no e-mail cadastrado em breve.
        </p>

        <div className="pt-6 border-t border-gray-100">
          <Button asChild className="w-full">
            <Link href="/">Voltar para a página inicial</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}