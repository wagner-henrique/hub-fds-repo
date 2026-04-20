"use client";

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Rocket } from 'lucide-react';

const heroFrames = [
  '/imagens_salas/arp1.JPG',
  '/imagens_salas/arp2.JPG',
  '/imagens_salas/audit1.JPG',
  '/imagens_salas/audit2.JPG',
  '/imagens_salas/ct1.JPG',
  '/imagens_salas/reuni1.JPG',
  '/imagens_salas/reuni2.JPG',
]

const Hero = () => {
  const [activeFrame, setActiveFrame] = useState(0)

  useEffect(() => {
    heroFrames.forEach((src) => {
      const image = new window.Image()
      image.src = src
    })
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return

      setActiveFrame((current) => (current + 1) % heroFrames.length)
    }, 2200)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-24 md:pt-20 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 h-[320px] w-[320px] rounded-full bg-primary/10 blur-[90px] animate-pulse sm:h-[600px] sm:w-[600px] sm:blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[240px] w-[240px] rounded-full bg-primary/5 blur-[80px] sm:h-[400px] sm:w-[400px] sm:blur-[100px]" />
      </div>

      <div className="container mx-auto grid gap-10 px-4 sm:px-6 md:grid-cols-2 md:gap-12 md:items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-6 border border-primary/20">
            <Sparkles size={16} />
            Fábrica de Sonhos - Arapiraca
          </div>
          <h1 className="text-4xl font-black leading-[1.1] mb-5 tracking-tight sm:text-5xl md:text-8xl md:mb-6">
            Onde suas <span className="text-primary">ideias</span> ganham vida.
          </h1>
          <p className="text-base text-muted-foreground mb-8 max-w-lg leading-relaxed sm:text-lg md:text-xl md:mb-10">
            O epicentro da inovação no Agreste. Infraestrutura de classe mundial para mentes inquietas e negócios visionários.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <a href="#espacos" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 font-bold text-white shadow-2xl shadow-primary/30 transition-all hover:scale-105 sm:w-auto sm:px-10 sm:py-5">
              Conhecer Espaços <ArrowRight size={20} />
            </a>
            <a href="#contato" className="w-full rounded-2xl border-2 border-primary/10 bg-white px-8 py-4 font-bold text-primary transition-colors hover:bg-primary/5 sm:w-auto sm:px-10 sm:py-5">
              Ver Localização
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative"
        >
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 overflow-hidden rounded-[2rem] border-8 border-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.2)] sm:rounded-[3rem] sm:border-[12px] sm:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)]"
          >
            <div className="relative h-[320px] w-full bg-slate-900 sm:h-[420px] md:h-[550px]">
              {heroFrames.map((src, index) => (
                <Image
                  key={src}
                  src={src}
                  alt="Salas do HUB FDS em sequência"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={index === 0}
                  draggable={false}
                  className={`absolute inset-0 h-full w-full select-none object-cover transition-all duration-1000 ease-out ${
                    index === activeFrame ? 'opacity-100 scale-105' : 'opacity-0 scale-110'
                  }`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-white backdrop-blur-md sm:left-5 sm:top-5">
                Tour das salas
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]" />
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white backdrop-blur-md sm:left-5 sm:right-5 sm:bottom-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                    Networking real
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {heroFrames.map((_, index) => (
                    <span
                      key={`hero-frame-dot-${index}`}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        index === activeFrame ? 'w-8 bg-white' : 'w-1.5 bg-white/45'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="relative z-20 mt-6 w-full max-w-sm rounded-[1.75rem] border border-primary/10 bg-white/90 p-5 shadow-2xl backdrop-blur-xl md:absolute md:-bottom-10 md:-right-10 md:mt-0 md:max-w-none md:rounded-[2rem] md:p-8"
          >
            <div className="flex items-center gap-4 md:gap-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 md:h-14 md:w-14">
                <Rocket size={28} />
              </div>
              <div>
                <p className="text-base font-black leading-none md:text-lg">Networking Real</p>
                <p className="mt-1 text-sm text-muted-foreground">+50 Empresas Conectadas</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;