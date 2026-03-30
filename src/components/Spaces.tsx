"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Wifi } from 'lucide-react';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ScrollReveal';

const spaces = [
  {
    title: "Sala de Reunião Executiva",
    description: "Ideal para fechamento de negócios e reuniões estratégicas.",
    capacity: "8 pessoas",
    image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=80&w=800",
    features: ["TV 4K", "Ar Condicionado", "Quadro Branco"]
  },
  {
    title: "Auditório para Eventos",
    description: "Espaço amplo para cursos, palestras e workshops.",
    capacity: "40 pessoas",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800",
    features: ["Som Profissional", "Projetor", "Palco"]
  },
  {
    title: "Coworking & Networking",
    description: "Estações de trabalho individuais em ambiente compartilhado.",
    capacity: "20 pessoas",
    image: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=800",
    features: ["Internet Fibra", "Café Liberado", "Lockers"]
  }
];

const Spaces = () => {
  return (
    <section id="espacos" className="py-24 bg-white">
      <div className="container mx-auto px-6">

        <ScrollReveal variant="fade" className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Nossos Espaços</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Infraestrutura completa pensada para produtividade e conforto. Escolha o ambiente que melhor se adapta à sua necessidade.
          </p>
        </ScrollReveal>

        <StaggerContainer
          stagger={0.12}
          delayChildren={0.1}
          itemVariant="slide-up"
          className="grid md:grid-cols-3 gap-8"
        >
          {spaces.map((space, index) => (
            <StaggerItem key={index}>
              <motion.div
                whileHover={{ y: -8, transition: { duration: 0.25, ease: "easeOut" } }}
                whileTap={{ scale: 0.98 }}
                className="group bg-secondary/30 rounded-[2rem] overflow-hidden border border-primary/5 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/8 transition-all duration-300 h-full"
              >
                <div className="relative h-64 overflow-hidden">
                  <motion.img
                    src={space.image}
                    alt={space.title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.07 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
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

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="w-full py-3 rounded-xl bg-white border border-primary/20 text-primary font-bold hover:bg-primary hover:text-white transition-colors duration-200"
                  >
                    Ver Disponibilidade
                  </motion.button>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

      </div>
    </section>
  );
};

export default Spaces;