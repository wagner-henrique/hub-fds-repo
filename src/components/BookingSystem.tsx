"use client";

import React from 'react';
import { Calendar as CalendarIcon, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import BookingDialog from './BookingDialog';
import { motion } from 'framer-motion';

const BookingSystem = () => {
  return (
    <section id="reserva" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto bg-primary rounded-[3.5rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl shadow-primary/20"
        >
          {/* Elementos Decorativos */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-2xl" />
          
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold mb-6 border border-white/10">
                <Sparkles size={16} />
                Vagas Limitadas
              </div>
              <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                Pronto para o <br />próximo nível?
              </h2>
              <p className="text-xl text-primary-foreground/80 mb-10 leading-relaxed">
                Agende uma visita guiada e descubra como o HUB FDS pode acelerar o seu crescimento e da sua empresa.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <BookingDialog>
                  <Button size="lg" className="bg-white text-primary hover:bg-secondary py-8 px-10 rounded-2xl text-lg font-bold gap-3 shadow-xl">
                    Agendar Agora <CalendarIcon size={20} />
                  </Button>
                </BookingDialog>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Confirmação Instantânea</h4>
                    <p className="text-sm text-white/60">Receba os detalhes no seu WhatsApp em minutos.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                    <ArrowRight size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Tour Personalizado</h4>
                    <p className="text-sm text-white/60">Conheça cada detalhe da nossa infraestrutura.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BookingSystem;