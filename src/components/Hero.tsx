"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Rocket, ChevronDown } from 'lucide-react';

const EXPO = [0.16, 1, 0.3, 1] as const;
const SOFT = [0.21, 0.47, 0.32, 0.98] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EXPO } },
};

const imageVariants = {
  hidden:  { opacity: 0, scale: 0.88, x: 30 },
  visible: {
    opacity: 1, scale: 1, x: 0,
    transition: { duration: 0.9, ease: EXPO, delay: 0.35 },
  },
};

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20 overflow-hidden">

      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-6 border border-primary/20 relative overflow-hidden">
              <Sparkles size={16} />
              Fábrica de Sonhos — Arapiraca
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
              />
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-8xl font-black leading-[1.1] mb-6 tracking-tight"
          >
            Onde suas{" "}
            <motion.span
              className="text-primary inline-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55, ease: EXPO }}
            >
              ideias
            </motion.span>{" "}
            ganham vida.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed"
          >
            O epicentro da inovação no Agreste. Infraestrutura de classe mundial
            para mentes inquietas e negócios visionários.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-primary text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-2 shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-shadow"
            >
              Conhecer Espaços
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
              >
                <ArrowRight size={20} />
              </motion.span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04, backgroundColor: "rgba(var(--primary-rgb), 0.05)" }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="bg-white text-primary border-2 border-primary/10 px-10 py-5 rounded-2xl font-bold transition-colors"
            >
              Ver Localização
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div
          variants={imageVariants}
          initial="hidden"
          animate="visible"
          className="relative"
        >
          <motion.div
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] border-[12px] border-white"
          >
            <img
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000"
              alt="Escritório Moderno"
              className="w-full h-[550px] object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9, ease: SOFT }}
          >
            <motion.div
              animate={{ y: [0, 14, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-10 -right-10 bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl z-20 border border-primary/10"
            >
              <motion.div
                className="flex items-center gap-5"
                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              >
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                  <Rocket size={28} />
                </div>
                <div>
                  <p className="font-black text-lg leading-none">Networking Real</p>
                  <p className="text-sm text-muted-foreground mt-1">+50 Empresas Conectadas</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground/50"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        <span className="text-xs font-medium tracking-widest uppercase">scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={18} />
        </motion.div>
      </motion.div>

    </section>
  );
};

export default Hero;