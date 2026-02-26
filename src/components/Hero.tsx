"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles size={16} />
            Fábrica de Sonhos - Centro de Inovação
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Onde suas <span className="text-primary">ideias</span> ganham vida.
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg">
            Salas para reuniões, cursos e eventos no coração de Arapiraca. Networking real e infraestrutura de ponta para o seu negócio.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-xl shadow-primary/20">
              Conhecer Espaços <ArrowRight size={20} />
            </button>
            <button className="border-2 border-primary/20 text-primary px-8 py-4 rounded-2xl font-bold hover:bg-primary/5 transition-colors">
              Ver Localização
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative"
        >
          <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white">
            <img 
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000" 
              alt="Escritório Moderno" 
              className="w-full h-[500px] object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl z-20 border border-primary/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <img src="/logo.png" alt="Logo" className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-sm">Networking Real</p>
                <p className="text-xs text-muted-foreground">+50 Empresas Conectadas</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;