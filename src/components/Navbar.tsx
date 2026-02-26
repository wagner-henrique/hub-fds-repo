"use client";

import React from 'react';
import { motion } from 'framer-motion';

const Navbar = () => {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-primary/10"
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="HUB FDS Logo" className="w-10 h-10 rounded-full" />
          <span className="font-bold text-xl tracking-tight text-primary">HUB FDS</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#home" className="text-sm font-medium hover:text-primary transition-colors">Início</a>
          <a href="#espacos" className="text-sm font-medium hover:text-primary transition-colors">Espaços</a>
          <a href="#reserva" className="text-sm font-medium hover:text-primary transition-colors">Reservas</a>
          <a href="#contato" className="text-sm font-medium hover:text-primary transition-colors">Contato</a>
          <button className="bg-primary text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            Agendar Visita
          </button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;