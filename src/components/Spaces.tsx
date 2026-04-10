"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BookingDialog from '@/components/BookingDialog';

import type { LandingSpace } from '@/types/landing';

type SpacesProps = {
  spaces: LandingSpace[];
};

const WHATSAPP_URL = 'https://wa.me/5582999999999'

const roomIds: Record<string, string> = {
  'sala-arapiraca': 'arapiraca',
  'sala-reuniao': 'reuniao',
  'auditorio': 'auditorio',
  'centro-treinamento': 'treinamento',
}

const isWhatsAppService = (spaceId: string) =>
  spaceId === 'endereco-fiscal' || spaceId === 'ensaio-fotografico'

const Spaces = ({ spaces }: SpacesProps) => {
  return (
    <section id="espacos" className="bg-white py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="mb-3 text-3xl font-bold sm:text-4xl">Nossos Espaços</h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Estruturas pensadas para agendamento rápido, eventos, reuniões e atendimento especializado.
          </p>
        </div>

        <div className="grid justify-items-center gap-5 md:grid-cols-2 xl:grid-cols-3">
          {spaces.map((space) => {
            const isWhatsapp = isWhatsAppService(space.id)
            const ctaLabel = isWhatsapp ? 'Falar no WhatsApp' : 'Agendar'
            const ctaDescription = isWhatsapp
              ? 'Clique para falar no WhatsApp e tirar dúvidas.'
              : 'Clique para abrir o agendamento deste espaço.'
            const whatsappMessage = `Olá! Quero mais informações sobre ${space.title} no HUB FDS.`

            return (
            <motion.div
              key={space.id}
              whileHover={{ y: -10 }}
              className="group flex h-full w-full max-w-[360px] flex-col overflow-hidden rounded-[1.75rem] border border-primary/5 bg-white shadow-sm transition-all hover:border-primary/20 hover:shadow-lg"
            >
              <div className="relative h-40 overflow-hidden sm:h-44">
                <img 
                  src={space.image} 
                  alt={space.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="mb-2 text-lg font-bold leading-tight sm:text-xl">{space.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{space.description}</p>
                
                <div className="mb-4 flex flex-col gap-2 text-sm font-medium text-slate-700 sm:mb-5">
                  <div className="flex items-center gap-1">
                    <Users size={16} className="text-primary" />
                    {space.capacity}
                  </div>
                </div>

                <div className="mb-5 flex flex-wrap gap-2 sm:mb-6">
                  {space.features.map((f, i) => (
                    <span key={i} className="rounded-md border border-primary/10 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      {f}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-2">
                  <p className="mb-3 text-xs uppercase tracking-wider text-primary">{ctaDescription}</p>
                  {isWhatsapp ? (
                    <Button asChild className="h-11 w-full rounded-xl font-bold shadow-sm" variant="default">
                      <a href={`${WHATSAPP_URL}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer">
                        {ctaLabel}
                      </a>
                    </Button>
                  ) : (
                    <BookingDialog initialRoomId={roomIds[space.id]}>
                      <Button className="h-11 w-full rounded-xl font-bold shadow-sm" variant="default">
                        {ctaLabel}
                      </Button>
                    </BookingDialog>
                  )}
                </div>
              </div>
            </motion.div>
          )})}
        </div>
      </div>
    </section>
  );
};

export default Spaces;