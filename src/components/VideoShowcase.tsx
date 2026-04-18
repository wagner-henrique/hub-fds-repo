"use client";

import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const VideoShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.5], ["100px", "0px"]);

  return (
    <section ref={containerRef} className="relative flex items-center justify-center overflow-hidden bg-white py-12 md:min-h-screen md:py-0">
      <motion.div 
        style={{ 
          scale, 
          opacity,
          borderRadius 
        }}
        className="relative h-[60vh] w-full overflow-hidden shadow-2xl sm:h-[70vh] md:h-[90vh]"
      >
        {!videoFailed ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/placeholder.svg"
            onError={() => setVideoFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/showocase2.mp4" type="video/mp4" />
            <source src="/showcase.webm" type="video/webm" />
          </video>
        ) : (
          <img
            src="/placeholder.svg"
            alt="Ambiente do HUB FDS"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-black/30 p-6 sm:p-10 md:p-24">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="mb-4 text-3xl font-black leading-tight text-white sm:text-5xl md:text-7xl">
              Sinta a energia do <br />
              <span className="text-primary">HUB FDS</span>
            </h2>
            <p className="max-w-md text-sm text-white/80 sm:text-base md:max-w-xl md:text-xl">
              Mais que um espaço, uma comunidade vibrante onde a inovação acontece todos os dias.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default VideoShowcase;