"use client";

import React from 'react';
import { MapPin, Phone, Instagram } from 'lucide-react';

const Contact = () => {
  return (
    <section id="contato" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-8">Onde estamos</h2>
            <div className="space-y-8">
              <div className="flex gap-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <MapPin size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-1">Endereço</h4>
                  <p className="text-muted-foreground">Rua Olavo Bilac, n°210, Centro, Arapiraca - AL.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <Phone size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-1">Telefone</h4>
                  <p className="text-muted-foreground">(82) 99999-9999</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <Instagram size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-1">Social</h4>
                  <a 
                    href="https://www.instagram.com/hubfds.br/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    @hubfds.br
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[450px] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-secondary/30">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3921.47654321!2d-36.66!3d-9.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwNDUnMDAuMCJTIDM2wrAzOScwMC4wIlc!5e0!3m2!1spt-BR!2sbr!4v1234567890" 
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