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

const BookingSystem = () => {
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
    <section id="reserva" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto bg-secondary/20 rounded-[3.5rem] p-4 md:p-8 border border-primary/5 shadow-2xl shadow-primary/5">
          <div className="bg-white rounded-[3rem] overflow-hidden shadow-xl grid md:grid-cols-12">
            
            {/* Lado Esquerdo - Info */}
            <div className="md:col-span-4 bg-primary p-12 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              
              <div className="relative z-10">
                <h2 className="text-4xl font-bold mb-6 leading-tight">Reserve seu <br />espaço agora.</h2>
                <p className="text-primary-foreground/70 mb-12">
                  Escolha a data e o horário que melhor funcionam para você. Nossa equipe entrará em contato para confirmar.
                </p>
              </div>

              <div className="space-y-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <CalendarIcon size={24} />
                  </div>
                  <div>
                    <p className="font-bold">Data Flexível</p>
                    <p className="text-sm text-primary-foreground/60">Segunda a Sexta</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="font-bold">Resposta Rápida</p>
                    <p className="text-sm text-primary-foreground/60">Confirmação em até 2h</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lado Direito - Form */}
            <div className="md:col-span-8 p-8 md:p-16 space-y-10">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={18} />
                    <Input 
                      placeholder="Como podemos te chamar?" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="pl-12 py-7 rounded-2xl border-secondary bg-secondary/10 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={18} />
                    <Input 
                      placeholder="(82) 99999-9999" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="pl-12 py-7 rounded-2xl border-secondary bg-secondary/10 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">E-mail Profissional</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={18} />
                    <Input 
                      placeholder="seu@email.com" 
                      type="email"
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="pl-12 py-7 rounded-2xl border-secondary bg-secondary/10 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Selecione a Data</label>
                  <Calendar 
                    mode="single" 
                    selected={date} 
                    onSelect={setDate} 
                    className="rounded-3xl border border-secondary/50 p-4 shadow-sm" 
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest ml-1">Horários Disponíveis</label>
                  <div className="grid grid-cols-2 gap-3">
                    {timeSlots.map((slot) => (
                      <motion.button
                        key={slot}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-4 rounded-2xl text-sm font-bold transition-all border-2 ${
                          selectedSlot === slot 
                          ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                          : 'bg-white border-secondary text-slate-600 hover:border-primary/30'
                        }`}
                      >
                        {slot}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleBooking}
                disabled={loading}
                className="w-full py-8 rounded-[2rem] text-lg font-bold shadow-2xl shadow-primary/20 gap-3"
              >
                {loading ? 'Processando...' : (
                  <>Solicitar Agendamento <Send size={20} /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingSystem;