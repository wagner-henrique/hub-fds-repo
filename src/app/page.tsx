import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import VideoShowcase from '@/components/VideoShowcase';
import Spaces from '@/components/Spaces';
import Testimonials from '@/components/Testimonials';
import BookingSystem from '@/components/BookingSystem';
import Contact from '@/components/Contact';
import { ScrollReveal } from '@/components/ScrollReveal';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-white">
      <Navbar />
      
      <main>
        <Hero />
        
        <ScrollReveal children={undefined}>
        </ScrollReveal>

        <VideoShowcase />
        
        <ScrollReveal>
          <Spaces />
        </ScrollReveal>
        
        <ScrollReveal delay={0.1}>
          <Testimonials />
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <BookingSystem />
        </ScrollReveal>
        
        <ScrollReveal delay={0.2}>
          <Contact />
        </ScrollReveal>
      </main>

      <footer className="py-16 border-t border-primary/10 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Image 
                  src="/logo.png" 
                  alt="HUB FDS" 
                  width={40} 
                  height={40} 
                  className="rounded-full"
                />
                <span className="font-bold text-2xl text-primary tracking-tighter">HUB FDS</span>
              </div>
              <p className="text-muted-foreground max-w-sm leading-relaxed">
                O maior centro de inovação e tecnologia de Arapiraca. Criando o futuro, um sonho de cada vez.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Links Rápidos</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link href="#home" className="hover:text-primary transition-colors">Início</Link></li>
                <li><Link href="#espacos" className="hover:text-primary transition-colors">Espaços</Link></li>
                <li><Link href="#reserva" className="hover:text-primary transition-colors">Reservas</Link></li>
                <li><Link href="#contato" className="hover:text-primary transition-colors">Contato</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Social</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="https://www.instagram.com/hubfds.br/" target="_blank" className="hover:text-primary transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">WhatsApp</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-primary/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} HUB FDS - Fábrica de Sonhos. Todos os direitos reservados.
            </p>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-colors">Privacidade</Link>
              <Link href="#" className="hover:text-primary transition-colors">Termos de Uso</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}