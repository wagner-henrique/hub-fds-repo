"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ScrollReveal';

const testimonials = [
  {
    name: "Wagner Henrique",
    role: "CEO da PrimeCode",
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

        <ScrollReveal variant="fade" className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Quem faz parte</h2>
          <p className="text-muted-foreground">
            Histórias reais de quem transforma ideias em realidade no nosso espaço.
          </p>
        </ScrollReveal>

        <StaggerContainer
          stagger={0.13}
          delayChildren={0.05}
          itemVariant="scale-up"
          className="grid md:grid-cols-3 gap-8"
        >
          {testimonials.map((t, i) => (
            <StaggerItem key={i}>
              <motion.div
                whileHover={{
                  y: -6,
                  boxShadow: "0 24px 48px -12px rgba(var(--primary-rgb), 0.12)",
                  transition: { duration: 0.22, ease: "easeOut" }
                }}
                whileTap={{ scale: 0.98 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-primary/5 border border-primary/5 relative h-full transition-colors duration-200"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                  viewport={{ once: true }}
                >
                  <Quote className="absolute top-8 right-8 text-primary/10" size={40} />
                </motion.div>

                <div className="flex items-center gap-4 mb-6">
                  <motion.img
                    src={t.avatar}
                    alt={t.name}
                    className="w-14 h-14 rounded-full border-2 border-primary/20"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.2 }}
                  />
                  <div>
                    <h4 className="font-bold">{t.name}</h4>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>

                {/* Depoimento */}
                <p className="text-muted-foreground italic leading-relaxed">"{t.content}"</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

      </div>
    </section>
  );
};

export default Testimonials;