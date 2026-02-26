"use client";

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBooking = async () => {
    if (!selectedSlot || !name || !email) {
      showError("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          date,
          time: selectedSlot
        }),
      });

      if (response.ok) {
        showSuccess(`Horário de ${selectedSlot} pré-reservado com sucesso!`);
        setName("");
        setEmail("");
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
            <div className="p-12 bg-primary text-white">
              <h2 className="text-4xl font-bold mb-6">Verifique a Disponibilidade</h2>
              <p className="text-primary-foreground/80 mb-12">
                Escolha a data e o horário desejado para sua reunião ou evento. Nosso sistema mostra em tempo real os espaços livres.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <CalendarIcon size={24} />
                  </div>
                  <div>
                    <p className="font-bold">Agendamento Online</p>
                    <p className="text-sm text-primary-foreground/60">Rápido e sem burocracia</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="font-bold">Flexibilidade Total</p>
                    <p className="text-sm text-primary-foreground/60">Reserve por hora ou período</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-12">
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nome</label>
                    <Input 
                      placeholder="Seu nome" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-xl border-primary/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">E-mail</label>
                    <Input 
                      placeholder="seu@email.com" 
                      type="email"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-xl border-primary/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 block">1. Selecione a Data</label>
                  <div className="border rounded-2xl p-4 inline-block bg-secondary/20">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 block">2. Horários Disponíveis</label>
                  <div className="grid grid-cols-4 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 rounded-xl text-sm font-bold transition-all ${
                          selectedSlot === slot 
                          ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                          : 'bg-secondary/50 hover:bg-secondary text-primary'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleBooking}
                  disabled={!selectedSlot || loading}
                  className="w-full py-8 rounded-2xl text-lg font-bold bg-primary hover:bg-primary/90 transition-all"
                >
                  {loading ? 'Processando...' : selectedSlot ? `Reservar para ${selectedSlot}` : 'Selecione um horário'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookingSystem;