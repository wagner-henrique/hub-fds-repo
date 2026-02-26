"use client";

import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import VideoShowcase from '@/components/VideoShowcase';
import Spaces from '@/components/Spaces';
import BookingSystem from '@/components/BookingSystem';
import Contact from '@/components/Contact';
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-white">
      <Navbar />
      
      <main>
        <Hero />
        
        <VideoShowcase />
        
        <div className="scroll-reveal">
          <Spaces />
        </div>
        
        <div className="scroll-reveal">
          <BookingSystem />
        </div>
        
        <div className="scroll-reveal">
          <Contact />
        </div>
      </main>

      <footer className="py-12 border-t border-primary/10 bg-white">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="HUB FDS" className="w-8 h-8 rounded-full" />
            <span className="font-bold text-primary">HUB FDS - Fábrica de Sonhos</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} HUB FDS. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <a href="https://www.instagram.com/hubfds.br/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">Instagram</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacidade</a>
          </div>
        </div>
        <MadeWithDyad />
      </footer>
    </div>
  );
};

export default Index;