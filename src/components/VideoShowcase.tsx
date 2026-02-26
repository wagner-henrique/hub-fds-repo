"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const VideoShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.5], ["100px", "0px"]);

  return (
    <section ref={containerRef} className="relative h-screen flex items-center justify-center overflow-hidden bg-white">
      <motion.div 
        style={{ 
          scale, 
          opacity,
          borderRadius 
        }}
        className="relative w-full h-[90vh] overflow-hidden shadow-2xl"
      >
        <video 
          src="/showcase.webm" 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 flex flex-col justify-end p-12 md:p-24">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-white text-4xl md:text-7xl font-black mb-4 leading-tight">
              Sinta a energia do <br />
              <span className="text-primary">HUB FDS</span>
            </h2>
            <p className="text-white/80 text-lg md:text-xl max-w-xl">
              Mais que um espaço, uma comunidade vibrante onde a inovação acontece todos os dias.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default VideoShowcase;