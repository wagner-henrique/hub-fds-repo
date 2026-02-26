import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import VideoShowcase from '@/components/VideoShowcase';
import Spaces from '@/components/Spaces';
import BookingSystem from '@/components/BookingSystem';
import Contact from '@/components/Contact';
import { MadeWithDyad } from "@/components/made-with-dyad";
import { ScrollReveal } from '@/components/ScrollReveal';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-white">
      <Navbar />
      
      <main>
        <Hero />
        
        <VideoShowcase />
        
        <ScrollReveal>
          <Spaces />
        </ScrollReveal>
        
        <ScrollReveal delay={0.2}>
          <BookingSystem />
        </ScrollReveal>
        
        <ScrollReveal delay={0.2}>
          <Contact />
        </ScrollReveal>
      </main>

      <footer className="py-12 border-t border-primary/10 bg-white">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="HUB FDS" 
              width={32} 
              height={32} 
              className="rounded-full"
            />
            <span className="font-bold text-primary">HUB FDS - Fábrica de Sonhos</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} HUB FDS. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <a 
              href="https://www.instagram.com/hubfds.br/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Instagram
            </a>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Privacidade
            </Link>
          </div>
        </div>
        <MadeWithDyad />
      </footer>
    </div>
  );
}