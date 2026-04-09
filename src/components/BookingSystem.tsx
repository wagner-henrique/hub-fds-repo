"use client";

import React from 'react';
import { Calendar as CalendarIcon, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import BookingDialog from './BookingDialog';
import { motion } from 'framer-motion';

const BookingSystem = () => {
  return (
    <section id="reserva" className="bg-white py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-primary p-6 text-white shadow-2xl shadow-primary/20 sm:p-8 md:rounded-[3.5rem] md:p-12 lg:p-20"
        >
          {/* Elementos Decorativos */}
          <div className="absolute right-0 top-0 h-64 w-64 -mr-32 -mt-32 rounded-full bg-white/10 blur-3xl md:h-96 md:w-96 md:-mr-48 md:-mt-48" />
          <div className="absolute bottom-0 left-0 h-40 w-40 -mb-20 -ml-20 rounded-full bg-black/10 blur-2xl md:h-64 md:w-64 md:-mb-32 md:-ml-32" />
          
          <div className="relative z-10 grid gap-10 md:grid-cols-2 md:items-center md:gap-12">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold mb-6 border border-white/10">
                <Sparkles size={16} />
                Vagas Limitadas
              </div>
              <h2 className="mb-5 text-3xl font-black leading-tight sm:text-4xl md:mb-6 md:text-6xl">
                Pronto para o <br />próximo nível?
              </h2>
              <p className="mb-8 text-base leading-relaxed text-primary-foreground/80 sm:text-lg md:mb-10 md:text-xl">
                Agende uma visita guiada e descubra como o HUB FDS pode acelerar o seu crescimento e da sua empresa.
              </p>
              
              <div className="flex flex-col gap-4 sm:flex-row">
                <BookingDialog>
                  <Button size="lg" className="w-full gap-3 rounded-2xl bg-white px-8 py-6 text-base font-bold text-primary shadow-xl hover:bg-secondary sm:w-auto sm:px-10 sm:py-8 sm:text-lg">
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