"use client";

import React, { useState } from 'react';
import { User, Mail, Phone, Send, CreditCard, Loader2 } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from '@/utils/toast';

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"
];

interface BookingFormProps {
  onSuccess?: () => void;
}

const BookingForm = ({ onSuccess }: BookingFormProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    
    if (val.length > 2) {
      val = val.replace(/^(\d{2})(\d)/g, '($1) $2');
    }
    if (val.length > 9) {
      val = val.replace(/(\d{5})(\d)/, '$1-$2');
    } else if (val.length > 8) {
      val = val.replace(/(\d{4})(\d)/, '$1-$2');
    }
    
    setFormData({ ...formData, phone: val });
  };

  const handleBooking = async () => {
    if (!selectedSlot || !formData.name || !formData.email || !formData.phone || !date) {
      showError("Por favor, preencha todos os campos e escolha um horário.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showError("Insira um e-mail válido.");
      return;
    }

    const phoneClean = formData.phone.replace(/\D/g, '');
    if (phoneClean.length < 10) {
      showError("Insira um WhatsApp válido.");
      return;
    }

    setLoading(true);
    try {
      const formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: phoneClean,
          date: formattedDate,
          time: selectedSlot
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showSuccess("Redirecionando para o ambiente seguro...");
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      } else {
        if (response.status === 409) {
          showError("Este horário acabou de ser reservado. Escolha outro.");
          setSelectedSlot(null);
        } else {
          throw new Error(data.error || "Erro ao processar a reserva.");
        }
      }
    } catch (error: any) {
      showError(error.message || "Falha na comunicação com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 py-4">
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

      <div className="grid md:grid-cols-2 gap-8">
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
            {timeSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`py-3 rounded-xl text-xs font-bold transition-all border-2 ${
                  selectedSlot === slot 
                  ? 'bg-primary border-primary text-white shadow-md' 
                  : 'bg-white border-secondary text-slate-600 hover:border-primary/30'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
        <p className="text-xs font-bold text-primary flex items-center gap-2">
          <CreditCard size={14} /> Pagamento de 50% (R$ 50,00) para confirmação
        </p>
      </div>

      <Button 
        onClick={handleBooking}
        disabled={loading}
        className="w-full py-7 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 gap-2 transition-all"
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> Processando Ambiente Seguro...</>
        ) : (
          <>Ir para Pagamento Seguro <Send size={18} /></>
        )}
      </Button>
    </div>
  );
};

export default BookingForm;