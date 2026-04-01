"use client"

import React, { useCallback, useEffect, useState } from 'react'
import { User, Mail, Phone, Send, CreditCard, Loader2, Briefcase, Presentation, Laptop, MessageCircle, Mic, Users } from 'lucide-react'
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { showSuccess, showError } from '@/utils/toast'
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react'
import type { ICardPaymentBrickPayer, ICardPaymentFormData } from '@mercadopago/sdk-react/esm/bricks/cardPayment/type'

const mpPublicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY

if (mpPublicKey) {
  initMercadoPago(mpPublicKey, { locale: 'pt-BR' })
}

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"
]

const rooms = [
  { id: 'reuniao', label: 'Sala de Reunião (Hora)', price: 100.00, icon: Briefcase },
  { id: 'arapiraca', label: 'Sala Arapiraca (Turno)', price: 500.00, icon: Users },
  { id: 'treinamento', label: 'Centro Treinamento (Turno)', price: 600.00, icon: Presentation },
  { id: 'auditorio', label: 'Auditório (Turno)', price: 730.00, icon: Mic },
  { id: 'coworking', label: 'Coworking', price: 0, icon: Laptop },
]

interface BookingFormProps {
  onSuccess?: () => void
}

export default function BookingForm({ onSuccess }: BookingFormProps) {
  const [step, setStep] = useState<'schedule' | 'details'>('schedule')
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string>('reuniao')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card')
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" })
  const [pixData, setPixData] = useState<{ qrCode?: string; qrCodeBase64?: string } | null>(null)
  const [pixBookingId, setPixBookingId] = useState<string | null>(null)
  const [pixStatusMessage, setPixStatusMessage] = useState<string | null>(null)
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  const currentRoomDetails = rooms.find(r => r.id === selectedRoom)

  const handleRoomChange = (roomId: string) => {
    setSelectedRoom(roomId)
    setSelectedSlots([])
    setStep('schedule')
    setPixData(null)
    setPixBookingId(null)
    setPixStatusMessage(null)
  }

  const checkPixBookingStatus = useCallback(async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) return

      const booking = await response.json()
      const status = booking?.status

      if (status === 'CONFIRMED') {
        showSuccess('Pagamento Pix confirmado! Sua reserva está garantida.')
        setPixStatusMessage('Pagamento aprovado! Redirecionando...')
        setPixBookingId(null)
        onSuccess?.()
        window.location.href = '/sucesso'
        return
      }

      if (status === 'CANCELLED') {
        showError('Pagamento Pix não foi aprovado. Gere um novo código para continuar.')
        setPixStatusMessage('Pagamento não aprovado. Gere um novo Pix para tentar novamente.')
        setPixBookingId(null)
        return
      }

      setPixStatusMessage('Aguardando confirmação do pagamento Pix em tempo real...')
    } catch {
      setPixStatusMessage('Aguardando confirmação do pagamento Pix em tempo real...')
    }
  }, [onSuccess])

  const isWeekend = date ? (date.getDay() === 0 || date.getDay() === 6) : false
  const hoursCount = selectedSlots.length

  const getDynamicPrice = () => {
    if (hoursCount === 0 || !selectedRoom) return 0
    if (selectedRoom === 'auditorio') return isWeekend ? 810 : 730
    if (selectedRoom === 'treinamento') return isWeekend ? 680 : 600
    if (selectedRoom === 'arapiraca') return isWeekend ? 600 : 500
    if (selectedRoom === 'reuniao') {
      if (hoursCount <= 2) return hoursCount * 100
      if (hoursCount <= 4) return 299
      return 640
    }
    return 0
  }

  const amount = getDynamicPrice()

  const toggleSlot = (slot: string) => {
    setSelectedSlots(prev => 
      prev.includes(slot) 
        ? prev.filter(s => s !== slot) 
        : [...prev, slot].sort()
    )
  }

  useEffect(() => {
    if (!pixBookingId) return

    const pollStatus = async () => {
      if (!pixBookingId) return
      await checkPixBookingStatus(pixBookingId)
    }

    pollStatus()
    const intervalId = window.setInterval(pollStatus, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [pixBookingId, checkPixBookingStatus])

  useEffect(() => {
    // Se algum dos horários selecionados acabar de ser marcado como ocupado, ele remove da seleção
    setSelectedSlots(prev => prev.filter(slot => !bookedSlots.includes(slot)))
  }, [bookedSlots])

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!date) return

      setAvailabilityLoading(true)
      try {
        const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0]
        const response = await fetch(`/api/bookings?date=${formattedDate}&room=${selectedRoom}`, {
          method: 'GET',
          cache: 'no-store',
        })

        if (!response.ok) {
          setBookedSlots([])
          return
        }

        const data = await response.json()
        const slots = Array.isArray(data?.bookedSlots) ? data.bookedSlots : []
        setBookedSlots(slots)
      } catch {
        setBookedSlots([])
      } finally {
        setAvailabilityLoading(false)
      }
    }

    fetchAvailability()
  }, [date, selectedRoom])

  useEffect(() => {
    if (selectedSlots.length > 0 && bookedSlots.includes(selectedSlots[0])) {
      setSelectedSlots([])
    }
  }, [bookedSlots, selectedSlots])

  const handleCheckPixNow = async () => {
    if (!pixBookingId) return
    setLoading(true)
    try {
      await checkPixBookingStatus(pixBookingId)
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 11) val = val.slice(0, 11)
    
    if (val.length > 2) {
      val = val.replace(/^(\d{2})(\d)/g, '($1) $2')
    }
    if (val.length > 9) {
      val = val.replace(/(\d{5})(\d)/, '$1-$2')
    } else if (val.length > 8) {
      val = val.replace(/(\d{4})(\d)/, '$1-$2')
    }
    
    setFormData({ ...formData, phone: val })
  }

const validateSchedule = () => {
    if (selectedSlots.length === 0) {
      showError("Escolha uma data e um horário para continuar.")
      return false
    }

    if (selectedSlots.some(slot => bookedSlots.includes(slot))) {
      showError("Um dos horários escolhidos já foi reservado. Escolha outro disponível.")
      return false
    }

    return true
  }

  const validatePersonalData = () => {
    if (selectedSlots.length === 0 || !formData.name || !formData.email || !formData.phone || !date) {
      showError("Por favor, preencha todos os campos e escolha um horário.")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      showError("Insira um e-mail válido.")
      return false
    }

    const phoneClean = formData.phone.replace(/\D/g, '')
    if (phoneClean.length < 10) {
      showError("Insira um WhatsApp válido.")
      return false
    }

    return true
  }

  const getBookingPayloadBase = () => {
    const phoneClean = formData.phone.replace(/\D/g, '')
    const formattedDate = new Date(date!.getTime() - date!.getTimezoneOffset() * 60000).toISOString().split('T')[0]

    return {
      name: formData.name,
      email: formData.email,
      phone: phoneClean,
      room: selectedRoom,
      date: formattedDate,
      time: selectedSlots,
    }
  }

  const handleCoworkingBooking = async () => {
    if (selectedRoom === 'coworking') {
      const msg = encodeURIComponent(`Olá! Gostaria de consultar os valores e disponibilidade para o espaço de Coworking.`)
      window.open(`https://wa.me/5582999999999?text=${msg}`, '_blank')
      return
    }
  }

  const handleTransparentCheckout = async (
    cardFormData: ICardPaymentFormData<ICardPaymentBrickPayer>,
  ) => {
    if (!validateSchedule() || !validatePersonalData()) {
      return
    }

    if (!mpPublicKey) {
      showError("A chave pública do Mercado Pago não está configurada.")
      return
    }

    setLoading(true)
    try {
      const payloadBase = getBookingPayloadBase()

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payloadBase,
          payment: {
            method: 'card',
            ...cardFormData,
            payer: {
              ...cardFormData.payer,
              email: formData.email,
            },
          },
        }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data?.payment?.status === 'approved') {
          showSuccess("Pagamento aprovado! Sua reserva foi confirmada.")
          onSuccess?.()
          window.location.href = '/sucesso'
          return
        }

        if (data?.payment?.status === 'pending') {
          showSuccess("Pagamento recebido e em análise. Atualizaremos sua reserva em breve.")
          onSuccess?.()
          window.location.href = '/sucesso'
          return
        } else {
          showError("Pagamento não aprovado. Verifique os dados do cartão e tente novamente.")
        }
      } else {
        if (response.status === 409) {
          showError("Este horário acabou de ser reservado para esta sala. Escolha outro.")
          setSelectedSlots([])
          setStep('schedule')
        } else {
          throw new Error(data.error || "Erro ao processar a reserva.")
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha na comunicação com o servidor."
      showError(message)
    } finally {
      setLoading(false)
    }
  }

  const handlePixCheckout = async () => {
    if (!validateSchedule() || !validatePersonalData()) {
      return
    }

    setLoading(true)
    try {
      const payloadBase = getBookingPayloadBase()

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payloadBase,
          payment: {
            method: 'pix',
          },
        }),
      })

      const data = await response.json()

      if (response.ok) {
        const qrCode = data?.payment?.pix?.qrCode
        const qrCodeBase64 = data?.payment?.pix?.qrCodeBase64
        const bookingId = data?.booking?.id

        if (qrCode || qrCodeBase64) {
          setPixData({ qrCode, qrCodeBase64 })
          if (bookingId) {
            setPixBookingId(bookingId)
            setPixStatusMessage('Aguardando confirmação do pagamento Pix em tempo real...')
          }
          showSuccess("Pix gerado! Escaneie o QR Code ou copie o código.")
        } else {
          showError("Não foi possível gerar o QR Code do Pix.")
        }
      } else {
        if (response.status === 409) {
          showError("Este horário acabou de ser reservado para esta sala. Escolha outro.")
          setSelectedSlots([])
          setStep('schedule')
        } else {
          throw new Error(data.error || "Erro ao gerar cobrança Pix.")
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha na comunicação com o servidor."
      showError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-2">
        <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Escolha o Espaço</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {rooms.map((room) => {
            const Icon = room.icon
            return (
              <button
                key={room.id}
                onClick={() => handleRoomChange(room.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${
                  selectedRoom === room.id
                    ? 'bg-primary/5 border-primary text-primary shadow-sm'
                    : 'bg-white border-secondary text-slate-500 hover:border-primary/30'
                }`}
              >
                <Icon size={24} />
                <span className="text-xs font-bold text-center leading-tight">{room.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className={`grid md:grid-cols-2 gap-8 transition-opacity duration-300 ${selectedRoom === 'coworking' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Data</label>
          <Calendar 
            mode="single" 
            selected={date} 
            onSelect={setDate}
            disabled={(currDate) => currDate < new Date(new Date().setHours(0, 0, 0, 0))}
            className="rounded-2xl border border-secondary/50 p-3 shadow-sm scale-90 origin-top-left" 
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Horário</label>
          <div className="grid grid-cols-2 gap-2">
            {timeSlots.map((slot) => {
              const isBooked = bookedSlots.includes(slot)
              const isSelected = selectedSlots.includes(slot)
              return (
                <button
                  key={slot}
                  onClick={() => toggleSlot(slot)}
                  disabled={selectedRoom === 'coworking' || isBooked}
                  className={`py-3 rounded-xl text-xs font-bold transition-all border-2 ${
                    isSelected
                      ? 'bg-primary border-primary text-white shadow-md'
                      : isBooked
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-white border-secondary text-slate-600 hover:border-primary/30'
                  }`}
                >
                  {slot}{isBooked ? ' • ocupado' : ''}
                </button>
              )
            })}
          </div>
          {availabilityLoading && selectedRoom !== 'coworking' && (
            <p className="text-xs text-muted-foreground">Verificando horários disponíveis...</p>
          )}
        </div>
      </div>

      {selectedRoom !== 'coworking' && currentRoomDetails && step === 'details' && (
        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
          <p className="text-xs font-bold text-primary flex items-center gap-2">
            <CreditCard size={14} /> Pagamento para confirmação: R$ {amount.toFixed(2).replace('.', ',')}
          </p>
        </div>
      )}

      {selectedRoom !== 'coworking' && step === 'details' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Data: <strong>{date?.toLocaleDateString('pt-BR')}</strong> às <strong>{selectedSlots.join(', ')}</strong></p>
            <Button variant="outline" onClick={() => setStep('schedule')}>Alterar data/horário</Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Nome</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={16} />
                <Input 
                  placeholder="Seu nome" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="pl-10 py-6 rounded-xl border-secondary bg-secondary/10 focus:bg-white transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={16} />
                <Input 
                  placeholder="(82) 99999-9999" 
                  value={formData.phone} 
                  onChange={handlePhoneChange}
                  className="pl-10 py-6 rounded-xl border-secondary bg-secondary/10 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={16} />
              <Input 
                placeholder="seu@email.com" 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="pl-10 py-6 rounded-xl border-secondary bg-secondary/10 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Como deseja pagar?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setPaymentMethod('card')
                  setPixData(null)
                  setPixBookingId(null)
                  setPixStatusMessage(null)
                }}
                className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                  paymentMethod === 'card'
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white border-secondary text-slate-600'
                }`}
              >
                Cartão
              </button>
              <button
                onClick={() => {
                  setPaymentMethod('pix')
                  setPixData(null)
                  setPixBookingId(null)
                  setPixStatusMessage(null)
                }}
                className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                  paymentMethod === 'pix'
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white border-secondary text-slate-600'
                }`}
              >
                Pix
              </button>
            </div>
          </div>

          {paymentMethod === 'card' && (
            <div className="rounded-2xl border border-secondary/50 p-4 bg-white">
              {mpPublicKey ? (
                <CardPayment
                  initialization={{
                    amount,
                    payer: {
                      email: formData.email,
                    },
                  }}
                  locale="pt-BR"
                  onSubmit={handleTransparentCheckout}
                  onError={() => showError("Falha ao inicializar o checkout transparente.")}
                  customization={{
                    paymentMethods: {
                      maxInstallments: 12,
                    },
                  }}
                />
              ) : (
                <p className="text-sm text-destructive">Configure a variável NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY para habilitar o checkout transparente.</p>
              )}
            </div>
          )}

          {paymentMethod === 'pix' && pixData && (
            <div className="rounded-2xl border border-secondary/50 p-4 bg-white space-y-4">
              {pixData.qrCodeBase64 && (
                <img
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                  alt="QR Code Pix"
                  className="w-48 h-48 mx-auto"
                />
              )}
              {pixData.qrCode && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground break-all">{pixData.qrCode}</p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigator.clipboard.writeText(pixData.qrCode || '')}
                  >
                    Copiar código Pix
                  </Button>
                </div>
              )}
              {pixStatusMessage && (
                <p className="text-sm text-muted-foreground text-center">{pixStatusMessage}</p>
              )}
              {pixBookingId && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleCheckPixNow}
                  disabled={loading}
                >
                  Já paguei, verificar agora
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <Button 
        onClick={
          selectedRoom === 'coworking'
            ? handleCoworkingBooking
            : step === 'schedule'
              ? () => validateSchedule() && setStep('details')
              : paymentMethod === 'pix'
                ? handlePixCheckout
                : undefined
        }
        disabled={
          loading ||
          (selectedRoom !== 'coworking' && step === 'details' && paymentMethod === 'card')
        }
        className={`w-full py-7 rounded-2xl text-base font-bold shadow-xl gap-2 transition-all ${
          selectedRoom === 'coworking' 
            ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20 text-white' 
            : 'shadow-primary/20'
        }`}
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> Processando...</>
        ) : selectedRoom === 'coworking' ? (
          <>Consultar via WhatsApp <MessageCircle size={18} /></>
        ) : step === 'schedule' ? (
          <>Continuar para dados e pagamento <Send size={18} /></>
        ) : paymentMethod === 'pix' ? (
          <>Gerar cobrança Pix <CreditCard size={18} /></>
        ) : (
          <>Finalize no formulário de cartão acima <Send size={18} /></>
        )}
      </Button>
    </div>
  )
}