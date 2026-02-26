"use client";

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, User, Mail, Phone } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from '@/utils/toast';

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"
];

const BookingSystem = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const handleBooking = async () => {
    if (!selectedSlot || !formData.name || !formData.email) {
      showError("Por favor, preencha os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date,
          time: selectedSlot
        }),
      });

      if (response.ok) {
        showSuccess(`Agendamento solicitado para ${selectedSlot}! Aguarde nossa confirmação.`);
        setFormData({ name: "", email: "", phone: "" });
        setSelectedSlot(null);
      } else {
        throw new Error();
      }
    } catch (error) {
      showError("Erro ao realizar reserva. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="reserva" className="py-24 bg-primary/5">
      <div className="container mx-auto px-6">
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-primary/10 overflow-hidden border border-primary/10">
          <div className="grid md:grid-cols-2">
            <div className="p-12 bg-primary text-white flex flex-col justify-between">
              <div>
                <h2 className="text-4xl font-bold mb-6">Agende sua Visita</h2>
                <p className="text-primary-foreground/80 mb-12">
                  Escolha o melhor horário para conhecer nossa estrutura ou realizar sua reunião.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><CalendarIcon size={24} /></div>
                  <div><p className="font-bold">Confirmação Rápida</p><p className="text-sm text-primary-foreground/60">Resposta em até 2h úteis</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><Clock size={24} /></div>
                  <div><p className="font-bold">Horários Flexíveis</p><p className="text-sm text-primary-foreground/60">Segunda a Sexta, 08h às 18h</p></div>
                </div>
              </div>
            </div>

            <div className="p-12 space-y-8">
              <div className="grid gap-4">
                <Input 
                  placeholder="Nome completo" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="rounded-xl"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    placeholder="E-mail" 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="rounded-xl"
                  />
                  <Input 
                    placeholder="WhatsApp" 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-3 block">Data</label>
                  <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-2xl border bg-secondary/10" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-3 block">Horário</label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 rounded-xl text-sm font-bold transition-all ${
                          selectedSlot === slot ? 'bg-primary text-white' : 'bg-secondary/50 hover:bg-secondary'
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
                className="w-full py-8 rounded-2xl text-lg font-bold"
              >
                {loading ? 'Enviando...' : 'Solicitar Agendamento'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingSystem;