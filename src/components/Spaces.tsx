"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Wifi } from 'lucide-react';

import type { LandingSpace } from '@/types/landing';

type SpacesProps = {
  spaces: LandingSpace[];
};

const Spaces = ({ spaces }: SpacesProps) => {
  return (
    <section id="espacos" className="bg-white py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-12 text-center sm:mb-16">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Nossos Espaços</h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Infraestrutura completa pensada para produtividade e conforto. Escolha o ambiente que melhor se adapta à sua necessidade.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -10 }}
              className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-primary/5 bg-secondary/30 transition-all hover:border-primary/20"
            >
              <div className="relative h-52 overflow-hidden sm:h-64">
                <img 
                  src={space.image} 
                  alt={space.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-primary backdrop-blur">
                  Disponível
                </div>
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <h3 className="mb-2 text-lg font-bold sm:text-xl">{space.title}</h3>
                <p className="mb-5 text-sm text-muted-foreground sm:mb-6">{space.description}</p>
                
                <div className="mb-5 flex flex-col gap-3 text-sm font-medium sm:mb-6 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-1">
                    <Users size={16} className="text-primary" />
                    {space.capacity}
                  </div>
                  <div className="flex items-center gap-1">
                    <Wifi size={16} className="text-primary" />
                    Fibra
                  </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-2 sm:mb-8">
                  {space.features.map((f, i) => (
                    <span key={i} className="text-[10px] uppercase tracking-wider font-bold bg-white px-2 py-1 rounded-md border border-primary/10">
                      {f}
                    </span>
                  ))}
                </div>

                <button className="mt-auto w-full rounded-xl border border-primary/20 bg-white py-3 font-bold text-primary transition-all hover:bg-primary hover:text-white">
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