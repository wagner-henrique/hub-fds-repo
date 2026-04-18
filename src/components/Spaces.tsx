"use client";

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BookingDialog from '@/components/BookingDialog';

import type { LandingSpace } from '@/types/landing';

type SpacesProps = {
  spaces: LandingSpace[];
};

const WHATSAPP_URL = 'https://wa.me/5582999999999'

const roomIds: Record<string, string> = {
  'sala-arapiraca': 'arapiraca',
  'sala-reuniao': 'reuniao',
  'auditorio': 'auditorio',
  'centro-treinamento': 'treinamento',
}

const isWhatsAppService = (spaceId: string) =>
  spaceId === 'endereco-fiscal' || spaceId === 'ensaio-fotografico'

const roomGalleryMap: Record<string, string[]> = {
  'sala-arapiraca': [
    '/imagens_salas/arp1.JPG',
    '/imagens_salas/arp2.JPG',
    '/imagens_salas/arp3.JPG',
    '/imagens_salas/arp4.JPG',
    '/imagens_salas/arp5.JPG',
    '/imagens_salas/arp6.JPG',
  ],
  'auditorio': [
    '/imagens_salas/audit1.JPG',
    '/imagens_salas/audit2.JPG',
    '/imagens_salas/audit3.JPG',
    '/imagens_salas/audit4.JPG',
    '/imagens_salas/audit5.JPG',
  ],
  'centro-treinamento': [
    '/imagens_salas/ct1.JPG',
    '/imagens_salas/ct2.JPG',
    '/imagens_salas/ct3.JPG',
    '/imagens_salas/ct4.JPG',
  ],
  'sala-reuniao': [
    '/imagens_salas/reuni1.JPG',
    '/imagens_salas/reuni2.JPG',
    '/imagens_salas/reuni3.JPG',
  ],
}

const Spaces = ({ spaces }: SpacesProps) => {
  const [carouselStep, setCarouselStep] = useState(0)
  const [manualOffsets, setManualOffsets] = useState<Record<string, number>>({})
  const [touchStartX, setTouchStartX] = useState<Record<string, number>>({})

  const preventImageContextMenu = (event: React.MouseEvent<HTMLImageElement>) => {
    event.preventDefault()
  }

  const preventImageDrag = (event: React.DragEvent<HTMLImageElement>) => {
    event.preventDefault()
  }

  const getSpaceImageIndex = (spaceId: string, galleryLength: number) => {
    if (galleryLength <= 0) return 0

    const manualOffset = manualOffsets[spaceId] ?? 0
    const baseIndex = carouselStep + manualOffset
    const normalizedIndex = ((baseIndex % galleryLength) + galleryLength) % galleryLength

    return normalizedIndex
  }

  const handleTouchStart = (spaceId: string, event: React.TouchEvent<HTMLDivElement>) => {
    const x = event.touches[0]?.clientX
    if (typeof x !== 'number') return

    setTouchStartX((prev) => ({ ...prev, [spaceId]: x }))
  }

  const handleTouchEnd = (spaceId: string, event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX[spaceId]
    const endX = event.changedTouches[0]?.clientX

    if (typeof startX !== 'number' || typeof endX !== 'number') return

    const deltaX = endX - startX
    const swipeThreshold = 42

    if (Math.abs(deltaX) < swipeThreshold) return

    setManualOffsets((prev) => ({
      ...prev,
      [spaceId]: (prev[spaceId] ?? 0) + (deltaX < 0 ? 1 : -1),
    }))

    setTouchStartX((prev) => ({
      ...prev,
      [spaceId]: 0,
    }))
  }

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCarouselStep((prev) => prev + 1)
    }, 3200)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const imageSources = new Set<string>()

    spaces.forEach((space) => {
      const gallery = roomGalleryMap[space.id] || [space.image]
      gallery.forEach((src) => imageSources.add(src))
    })

    const preloadLinks: HTMLLinkElement[] = []

    imageSources.forEach((src) => {
      const preloadLink = document.createElement('link')
      preloadLink.rel = 'preload'
      preloadLink.as = 'image'
      preloadLink.href = src
      document.head.appendChild(preloadLink)
      preloadLinks.push(preloadLink)

      const image = new Image()
      image.decoding = 'async'
      image.loading = 'eager'
      image.src = src
    })

    return () => {
      preloadLinks.forEach((link) => {
        if (link.parentNode) {
          link.parentNode.removeChild(link)
        }
      })
    }
  }, [spaces])

  return (
    <section id="espacos" className="bg-white py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mb-10 text-center sm:mb-12">
          <h2 className="mb-3 text-3xl font-bold sm:text-4xl">Nossos Espaços</h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Estruturas pensadas para agendamento rápido, eventos, reuniões e atendimento especializado.
          </p>
        </div>

        <div className="grid justify-items-center gap-5 md:grid-cols-2 xl:grid-cols-3">
          {spaces.map((space) => {
            const isWhatsapp = isWhatsAppService(space.id)
            const ctaLabel = isWhatsapp ? 'Falar no WhatsApp' : 'Agendar'
            const ctaDescription = isWhatsapp
              ? 'Clique para falar no WhatsApp e tirar dúvidas.'
              : 'Clique para abrir o agendamento deste espaço.'
            const whatsappMessage = `Olá! Quero mais informações sobre ${space.title} no HUB FDS.`
            const gallery = roomGalleryMap[space.id] || [space.image]
            const imageIndex = getSpaceImageIndex(space.id, gallery.length)
            const activeImage = gallery[imageIndex] || space.image

            return (
            <motion.div
              key={space.id}
              whileHover={{ y: -10 }}
              className="group flex h-full w-full max-w-[360px] flex-col overflow-hidden rounded-[1.75rem] border border-primary/5 bg-white shadow-sm transition-all hover:border-primary/20 hover:shadow-lg"
            >
              <div
                className="relative h-40 overflow-hidden bg-slate-200 sm:h-44"
                onTouchStart={(event) => handleTouchStart(space.id, event)}
                onTouchEnd={(event) => handleTouchEnd(space.id, event)}
                style={{ touchAction: 'pan-y' }}
              >
                <AnimatePresence initial={false} mode="sync">
                  <motion.img
                    key={`${space.id}-${activeImage}`}
                    src={activeImage}
                    alt={space.title}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.01 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    draggable={false}
                    onContextMenu={preventImageContextMenu}
                    onDragStartCapture={preventImageDrag}
                    className="absolute inset-0 h-full w-full object-cover will-change-transform group-hover:scale-110 transition-transform duration-500"
                  />
                </AnimatePresence>
                {gallery.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/30 px-2 py-1 backdrop-blur-sm">
                    {gallery.map((_, idx) => (
                      <span
                        key={`${space.id}-dot-${idx}`}
                        className={`h-1.5 w-1.5 rounded-full ${idx === imageIndex ? 'bg-white' : 'bg-white/45'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="mb-2 text-lg font-bold leading-tight sm:text-xl">{space.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{space.description}</p>
                
                <div className="mb-4 flex flex-col gap-2 text-sm font-medium text-slate-700 sm:mb-5">
                  <div className="flex items-center gap-1">
                    <Users size={16} className="text-primary" />
                    {space.capacity}
                  </div>
                </div>

                <div className="mb-5 flex flex-wrap gap-2 sm:mb-6">
                  {space.features.map((f, i) => (
                    <span key={i} className="rounded-md border border-primary/10 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      {f}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-2">
                  <p className="mb-3 text-xs uppercase tracking-wider text-primary">{ctaDescription}</p>
                  {isWhatsapp ? (
                    <Button asChild className="h-11 w-full rounded-xl font-bold shadow-sm" variant="default">
                      <a href={`${WHATSAPP_URL}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer">
                        {ctaLabel}
                      </a>
                    </Button>
                  ) : (
                    <BookingDialog initialRoomId={roomIds[space.id]}>
                      <Button className="h-11 w-full rounded-xl font-bold shadow-sm" variant="default">
                        {ctaLabel}
                      </Button>
                    </BookingDialog>
                  )}
                </div>
              </div>
            </motion.div>
          )})}
        </div>
      </div>
    </section>
  );
};

export default Spaces;