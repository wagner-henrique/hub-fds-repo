"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Monitor, Coffee, Wifi, Mic, Tv } from 'lucide-react'; 

const spaces = [
  {
    title: "Auditório",
    description: "Ideal para grandes eventos, treinamentos, palestras e workshops.",
    capacity: "Até 130 pessoas",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800",
    features: ["Mesa de som", "Projetor", "Climatizado", "Microfones sem fio"]
  },
  {
    title: "Centro de Treinamento",
    description: "Ambiente aconchegante com estilo rústico para cursos e reuniões.",
    capacity: "Até 70 pessoas",
    image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=80&w=800",
    features: ["Projetor", "Caixa de som", "Climatizado", "Camarim"]
  },
  {
    title: "Sala Arapiraca",
    description: "Espaço moderno com identidade cultural. Ideal para encontros reservados.",
    capacity: "Até 40 pessoas",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
    features: ["TV 55\"", "Caixa de som", "Climatizado", "Microfones"]
  },
  {
    title: "Sala de Reunião",
    description: "Ambiente bem estruturado para encontros executivos, mentorias e entrevistas.",
    capacity: "Até 7 pessoas",
    image: "https://images.unsplash.com/photo-1582653291997-079a1c04e5d1?auto=format&fit=crop&q=80&w=800",
    features: ["TV 55\"", "Lousa Branca", "Climatizado", "Água e Café"]
  },
  {
    title: "Estação de Trabalho (Coworking)",
    description: "Mesas individuais em ambiente compartilhado para produtividade.",
    capacity: "Individual",
    image: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=800",
    features: ["Internet Fibra", "Ambiente Climatizado"]
  }
];

const Spaces = ({ spaces }: SpacesProps) => {
  return (
    <section id="espacos" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Nossos Espaços</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Infraestrutura completa pensada para produtividade e conforto. Escolha o ambiente que melhor se adapta à sua necessidade.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {spaces.map((space, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -10 }}
              className="group bg-secondary/30 rounded-[2rem] overflow-hidden border border-primary/5 hover:border-primary/20 transition-all"
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={space.image} 
                  alt={space.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-primary">
                  Disponível
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold mb-2">{space.title}</h3>
                <p className="text-sm text-muted-foreground mb-6">{space.description}</p>
                
                <div className="flex items-center gap-4 mb-6 text-sm font-medium">
                  <div className="flex items-center gap-1">
                    <Users size={16} className="text-primary" />
                    {space.capacity}
                  </div>
                  <div className="flex items-center gap-1">
                    <Wifi size={16} className="text-primary" />
                    Fibra
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {space.features.map((f, i) => (
                    <span key={i} className="text-[10px] uppercase tracking-wider font-bold bg-white px-2 py-1 rounded-md border border-primary/10">
                      {f}
                    </span>
                  ))}
                </div>

                <button className="w-full py-3 rounded-xl bg-white border border-primary/20 text-primary font-bold hover:bg-primary hover:text-white transition-all">
                  Ver Disponibilidade
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Spaces;