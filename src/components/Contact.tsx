"use client";

import React from 'react';
import { MapPin, Phone, Instagram, Clock3 } from 'lucide-react';

const Contact = () => {
  return (
    <section id="contato" className="bg-white py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
          <div>
            <h2 className="mb-6 text-3xl font-bold sm:mb-8 sm:text-4xl">Onde estamos</h2>
            <div className="space-y-6 sm:space-y-8">
              <div className="flex items-start gap-4 sm:gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-14 sm:w-14">
                  <MapPin size={24} className="sm:hidden" />
                  <MapPin size={28} className="hidden sm:block" />
                </div>
                <div>
                  <h4 className="mb-1 text-lg font-bold sm:text-xl">Endereço</h4>
                  <p className="text-sm text-muted-foreground sm:text-base">Rua Olavo Bilac, n°210, Centro, Arapiraca - AL.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 sm:gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-14 sm:w-14">
                  <Phone size={24} className="sm:hidden" />
                  <Phone size={28} className="hidden sm:block" />
                </div>
                <div>
                  <h4 className="mb-1 text-lg font-bold sm:text-xl">Telefone</h4>
                  <p className="text-sm text-muted-foreground sm:text-base">(82) 99999-9999</p>
                </div>
              </div>

              <div className="flex items-start gap-4 sm:gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-14 sm:w-14">
                  <Clock3 size={24} className="sm:hidden" />
                  <Clock3 size={28} className="hidden sm:block" />
                </div>
                <div>
                  <h4 className="mb-1 text-lg font-bold sm:text-xl">Horário de funcionamento</h4>
                  <p className="text-sm text-muted-foreground sm:text-base">Das 08:00 às 22:00</p>
                </div>
              </div>

              <div className="flex items-start gap-4 sm:gap-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-14 sm:w-14">
                  <Instagram size={24} className="sm:hidden" />
                  <Instagram size={28} className="hidden sm:block" />
                </div>
                <div>
                  <h4 className="mb-1 text-lg font-bold sm:text-xl">Social</h4>
                  <a 
                    href="https://www.instagram.com/hubfds.br/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-primary sm:text-base"
                  >
                    @hubfds.br
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[320px] overflow-hidden rounded-[2rem] border-4 border-secondary/30 shadow-2xl sm:h-[380px] sm:rounded-[3rem] sm:border-8 md:h-[450px]">
            <iframe 
              src="https://www.google.com/maps?q=HUB+FDS+O+melhor+espa%C3%A7o+de+eventos+de+Arapiraca+Educa%C3%A7%C3%A3o+tecnol%C3%B3gica+%2B+Networking+real&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;