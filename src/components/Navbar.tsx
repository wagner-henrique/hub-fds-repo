"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import BookingDialog from './BookingDialog';

const Navbar = () => {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-primary/10"
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-110">
            <Image 
              src="/logo.png" 
              alt="HUB FDS Logo" 
              width={40} 
              height={40} 
              className="rounded-full" 
            />
          </div>
          <span className="font-bold text-xl tracking-tight text-primary">HUB FDS</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="#home" className="nav-link text-sm font-medium hover:text-primary transition-colors">Início</Link>
          <Link href="#espacos" className="nav-link text-sm font-medium hover:text-primary transition-colors">Espaços</Link>
          <Link href="#reserva" className="nav-link text-sm font-medium hover:text-primary transition-colors">Reservas</Link>
          <Link href="#contato" className="nav-link text-sm font-medium hover:text-primary transition-colors">Contato</Link>
          
          <BookingDialog>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Agendar Visita
            </motion.button>
          </BookingDialog>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;