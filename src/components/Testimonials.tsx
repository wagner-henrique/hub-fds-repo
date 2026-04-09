"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import type { LandingTestimonial } from '@/types/landing';

type TestimonialsProps = {
  testimonials: LandingTestimonial[];
};

const Testimonials = ({ testimonials }: TestimonialsProps) => {
  return (
    <section className="bg-secondary/20 py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-12 text-center sm:mb-16">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Quem faz parte</h2>
          <p className="text-sm text-muted-foreground sm:text-base">Histórias reais de quem transforma ideias em realidade no nosso espaço.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="relative rounded-[2rem] border border-primary/5 bg-white p-6 shadow-xl shadow-primary/5 sm:rounded-[2.5rem] sm:p-8"
            >
              <Quote className="absolute right-6 top-6 text-primary/10 sm:right-8 sm:top-8" size={32} />
              <div className="mb-5 flex items-center gap-4 sm:mb-6">
                <img src={t.avatar} alt={t.name} className="h-12 w-12 rounded-full border-2 border-primary/20 sm:h-14 sm:w-14" />
                <div>
                  <h4 className="font-bold">{t.name}</h4>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
              <p className="text-sm italic leading-relaxed text-muted-foreground sm:text-base">"{t.content}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;