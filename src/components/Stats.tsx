"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Rocket, Calendar, Award } from 'lucide-react';

const stats = [
  { label: "Empresas Conectadas", value: "+50", icon: Rocket },
  { label: "Eventos Realizados", value: "+120", icon: Calendar },
  { label: "Membros Ativos", value: "+300", icon: Users },
  { label: "Prêmios de Inovação", value: "05", icon: Award },
];

const Stats = () => {
  return (
    <section className="py-20 bg-primary text-white overflow-hidden relative">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm">
                <stat.icon size={32} />
              </div>
              <h3 className="text-4xl md:text-5xl font-black mb-2">{stat.value}</h3>
              <p className="text-primary-foreground/70 font-medium uppercase tracking-wider text-xs">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;