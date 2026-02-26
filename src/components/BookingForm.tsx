"use client";

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, User, Mail, Phone, Send } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from '@/utils/toast';
import { motion } from 'framer-motion';

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

  const handleBooking = async () => {
    if (!selectedSlot || !formData.name || !formData.email || !formData.phone || !date) {
      showError("Por favor, preencha todos os campos e escolha um horário.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: date.toISOString(),
          time: selectedSlot
        }),
      });

      if (response.ok) {
        showSuccess(`Sucesso! Agendamento solicitado para ${selectedSlot}.`);
        setFormData({ name: "", email: "", phone: "" });
        setSelectedSlot(null);
        if (onSuccess) onSuccess();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao realizar reserva.");
      }
    } catch (error: any) {
      showError(error.message || "Erro ao realizar reserva. Tente novamente.");
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
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
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

      <Button 
        onClick={handleBooking}
        disabled={loading}
        className="w-full py-7 rounded-2xl text-base font-bold shadow-xl shadow-primary/20 gap-2"
      >
        {loading ? 'Processando...' : (
          <>Confirmar Agendamento <Send size={18} /></>
        )}
      </Button>
    </div>
  );
};

export default BookingForm;