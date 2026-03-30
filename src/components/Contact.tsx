"use client";
import React from 'react';
import { MapPin, Phone, Instagram } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ScrollReveal';

const contactItems = [
  {
    icon: <MapPin size={28} />,
    title: "Endereço",
    content: "Rua Olavo Bilac, n°210, Centro, Arapiraca - AL.",
    href: null,
  },
  {
    icon: <Phone size={28} />,
    title: "Telefone",
    content: "(82) 99999-9999",
    href: "tel:+5582999999999",
  },
  {
    icon: <Instagram size={28} />,
    title: "Social",
    content: "@hubfds.br",
    href: "https://www.instagram.com/hubfds.br/",
  },
];

const Contact = () => {
  return (
    <section id="contato" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">

          <div>
            <ScrollReveal variant="slide-right" margin="-60px">
              <h2 className="text-4xl font-bold mb-8">Onde estamos</h2>
            </ScrollReveal>

            <StaggerContainer
              stagger={0.12}
              delayChildren={0.15}
              itemVariant="slide-right"
              className="space-y-8"
            >
              {contactItems.map((item, i) => (
                <StaggerItem key={i}>
                  <motion.div
                    className="flex gap-6"
                    whileHover={{ x: 4, transition: { duration: 0.2, ease: "easeOut" } }}
                  >
                    <motion.div
                      className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0"
                      whileHover={{
                        backgroundColor: "rgba(var(--primary-rgb), 0.18)",
                        scale: 1.08,
                        transition: { duration: 0.2 }
                      }}
                    >
                      {item.icon}
                    </motion.div>

                    <div>
                      <h4 className="font-bold text-xl mb-1">{item.title}</h4>
                      {item.href ? (
                        <a
                          href={item.href}
                          target={item.href.startsWith("http") ? "_blank" : undefined}
                          rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="text-muted-foreground hover:text-primary transition-colors duration-150"
                        >
                          {item.content}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">{item.content}</p>
                      )}
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>

          <ScrollReveal variant="slide-left" delay={0.1} margin="-60px">
            <motion.div
              className="h-[450px] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-secondary/30"
              whileHover={{
                scale: 1.01,
                boxShadow: "0 32px 64px -16px rgba(0,0,0,0.15)",
                transition: { duration: 0.3, ease: "easeOut" }
              }}
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3921.47654321!2d-36.66!3d-9.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwNDUnMDAuMCJTIDM2wrAzOScwMC4wIlc!5e0!3m2!1spt-BR!2sbr!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </motion.div>
          </ScrollReveal>

        </div>
      </div>
    </section>
  );
};

export default Contact;