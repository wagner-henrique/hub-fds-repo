"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-6 border border-primary/20">
            <Sparkles size={16} />
            Fábrica de Sonhos - Arapiraca
          </div>
          <h1 className="text-5xl md:text-8xl font-black leading-[1.1] mb-6 tracking-tight">
            Onde suas <span className="text-primary">ideias</span> ganham vida.
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
            O epicentro da inovação no Agreste. Infraestrutura de classe mundial para mentes inquietas e negócios visionários.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-primary text-white px-10 py-5 rounded-2xl font-bold hover:scale-105 transition-all flex items-center gap-2 shadow-2xl shadow-primary/30">
              Conhecer Espaços <ArrowRight size={20} />
            </button>
            <button className="bg-white text-primary border-2 border-primary/10 px-10 py-5 rounded-2xl font-bold hover:bg-primary/5 transition-colors">
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
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] border-[12px] border-white"
          >
            <img 
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000" 
              alt="Escritório Moderno" 
              className="w-full h-[550px] object-cover"
            />
          </motion.div>
          
          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-10 -right-10 bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl z-20 border border-primary/10"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <Rocket size={28} />
              </div>
              <div>
                <p className="font-black text-lg leading-none">Networking Real</p>
                <p className="text-sm text-muted-foreground mt-1">+50 Empresas Conectadas</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;