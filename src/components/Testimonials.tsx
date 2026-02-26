"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    name: "Ricardo Santos",
    role: "CEO da TechAlagoas",
    content: "O HUB FDS mudou a forma como nossa equipe colabora. O ambiente é inspirador e a infraestrutura é impecável.",
    avatar: "https://i.pravatar.cc/150?u=ricardo"
  },
  {
    name: "Ana Oliveira",
    role: "Fundadora da CreativeMind",
    content: "Melhor lugar em Arapiraca para realizar workshops. O suporte da equipe é sensacional e o espaço é muito moderno.",
    avatar: "https://i.pravatar.cc/150?u=ana"
  },
  {
    name: "Marcos Lima",
    role: "Desenvolvedor Fullstack",
    content: "O networking que fiz aqui valeu cada centavo. Conectei-me com parceiros que hoje são fundamentais para meu negócio.",
    avatar: "https://i.pravatar.cc/150?u=marcos"
  }
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-secondary/20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Quem faz parte</h2>
          <p className="text-muted-foreground">Histórias reais de quem transforma ideias em realidade no nosso espaço.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-primary/5 border border-primary/5 relative"
            >
              <Quote className="absolute top-8 right-8 text-primary/10" size={40} />
              <div className="flex items-center gap-4 mb-6">
                <img src={t.avatar} alt={t.name} className="w-14 h-14 rounded-full border-2 border-primary/20" />
                <div>
                  <h4 className="font-bold">{t.name}</h4>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
              <p className="text-muted-foreground italic leading-relaxed">"{t.content}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;