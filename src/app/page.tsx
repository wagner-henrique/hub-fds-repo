import React from 'react'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import VideoShowcase from '@/components/VideoShowcase'
import LandingContentSections from '@/components/LandingContentSections'
import BookingSystem from '@/components/BookingSystem'
import Contact from '@/components/Contact'
import { ScrollReveal } from '@/components/ScrollReveal'
import Image from 'next/image'
import Link from 'next/link'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hubfds.com'

export const metadata: Metadata = {
  title: 'Coworking, Eventos e Salas em Arapiraca - AL',
  description:
    'Conheça o HUB FDS em Arapiraca: coworking, salas para reunião, auditório e espaços para eventos, treinamentos e networking com agendamento rápido.',
  keywords: [
    'coworking em arapiraca',
    'espaço para eventos arapiraca',
    'sala de reunião arapiraca',
    'auditório em arapiraca',
    'hub fds',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    title: 'HUB FDS em Arapiraca | Coworking, Eventos e Reuniões',
    description:
      'Estrutura completa para empresas, criadores e eventos em Arapiraca - AL. Reserve espaços com agilidade no HUB FDS.',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Logo do HUB FDS em Arapiraca',
      },
    ],
  },
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background selection:bg-primary selection:text-white">
      <Navbar />
      
      <main>
        <Hero />
        
        <VideoShowcase />

        <LandingContentSections />

        <ScrollReveal delay={0.2}>
          <BookingSystem />
        </ScrollReveal>
        
        <ScrollReveal delay={0.2}>
          <Contact />
        </ScrollReveal>
      </main>

      <footer className="border-t border-primary/10 bg-white py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="mb-6 flex items-center gap-3">
                <Image 
                  src="/logo.png" 
                  alt="HUB FDS" 
                  width={40} 
                  height={40} 
                  className="rounded-full"
                />
                <span className="text-2xl font-bold tracking-tighter text-primary">HUB FDS</span>
              </div>
              <p className="max-w-sm leading-relaxed text-muted-foreground">
                O maior centro de inovação e tecnologia de Arapiraca. Criando o futuro, um sonho de cada vez.
              </p>
            </div>
            <div>
              <h4 className="mb-6 font-bold">Links Rápidos</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link href="/" className="hover:text-primary transition-colors">Início</Link></li>
                <li><Link href="#espacos" className="hover:text-primary transition-colors">Espaços</Link></li>
                <li><Link href="#reserva" className="hover:text-primary transition-colors">Reservas</Link></li>
                <li><Link href="#contato" className="hover:text-primary transition-colors">Contato</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 font-bold">Social</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="https://www.instagram.com/hubfds.br/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Instagram</a></li>
                <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">LinkedIn</a></li>
                <li><a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">WhatsApp</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col items-start gap-4 border-t border-primary/5 pt-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:gap-6">
            <p>
              © {new Date().getFullYear()} HUB FDS - Fábrica de Sonhos. Todos os direitos reservados.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <Link href="/privacidade" className="hover:text-primary transition-colors">Privacidade</Link>
              <Link href="/termos" className="hover:text-primary transition-colors">Termos de Uso</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}