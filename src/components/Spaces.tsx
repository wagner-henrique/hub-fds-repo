"use client";

import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BookingDialog from '@/components/BookingDialog';

import type { LandingSpace } from '@/types/landing';

type SpacesProps = {
  spaces: LandingSpace[];
};

const WHATSAPP_URL = 'https://wa.me/5582981161290'

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
  const sectionRef = useRef<HTMLElement | null>(null)
  const touchStartXRef = useRef<Record<string, number>>({})
  const [carouselStep, setCarouselStep] = useState(0)
  const [isSectionVisible, setIsSectionVisible] = useState(false)
  const [manualOffsets, setManualOffsets] = useState<Record<string, number>>({})

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

    touchStartXRef.current[spaceId] = x
  }

  const handleTouchEnd = (spaceId: string, event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartXRef.current[spaceId]
    const endX = event.changedTouches[0]?.clientX

    if (typeof startX !== 'number' || typeof endX !== 'number') return

    const deltaX = endX - startX
    const swipeThreshold = 42

    if (Math.abs(deltaX) < swipeThreshold) return

    setManualOffsets((prev) => ({
      ...prev,
      [spaceId]: (prev[spaceId] ?? 0) + (deltaX < 0 ? 1 : -1),
    }))

    touchStartXRef.current[spaceId] = 0
  }

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsSectionVisible(Boolean(entry?.isIntersecting))
      },
      { threshold: 0.2 }
    )

    observer.observe(section)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isSectionVisible) return

    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      setCarouselStep((prev) => prev + 1)
    }, 3600)

    return () => window.clearInterval(timer)
  }, [isSectionVisible])

  useEffect(() => {
    if (!isSectionVisible) return

    const sources = new Set<string>()

    spaces.forEach((space) => {
      const gallery = roomGalleryMap[space.id] || [space.image]
      gallery.forEach((src) => sources.add(src))
    })

    sources.forEach((src) => {
      const img = new window.Image()
      img.src = src
    })
  }, [isSectionVisible, spaces])

  return (
    <section ref={sectionRef} id="espacos" className="bg-white py-12 md:py-16">
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
                {gallery.map((imageSrc, idx) => (
                  <Image
                    key={`${space.id}-${imageSrc}`}
                    src={imageSrc}
                    alt={space.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 360px"
                    quality={72}
                    loading={idx === imageIndex ? 'eager' : 'lazy'}
                    draggable={false}
                    onContextMenu={preventImageContextMenu}
                    onDragStart={preventImageDrag}
                    className={`absolute inset-0 h-full w-full select-none object-cover transition-opacity duration-500 ease-out will-change-opacity ${idx === imageIndex ? 'opacity-100' : 'opacity-0'}`}
                  />
                ))}
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