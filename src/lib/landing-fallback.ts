import type { LandingSpace, LandingTestimonial } from "@/types/landing"

export const FALLBACK_SPACES: LandingSpace[] = [
  {
    id: "space-reuniao-executiva",
    title: "Sala de Reunião Executiva",
    description: "Ideal para fechamento de negócios e reuniões estratégicas.",
    capacity: "8 pessoas",
    image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&q=80&w=800",
    features: ["TV 4K", "Ar Condicionado", "Quadro Branco"],
  },
  {
    id: "space-auditorio-eventos",
    title: "Auditório para Eventos",
    description: "Espaço amplo para cursos, palestras e workshops.",
    capacity: "40 pessoas",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800",
    features: ["Som Profissional", "Projetor", "Palco"],
  },
  {
    id: "space-coworking-networking",
    title: "Coworking & Networking",
    description: "Estações de trabalho individuais em ambiente compartilhado.",
    capacity: "20 pessoas",
    image: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&q=80&w=800",
    features: ["Internet Fibra", "Café Liberado", "Lockers"],
  },
]

export const FALLBACK_TESTIMONIALS: LandingTestimonial[] = [
  {
    id: "testimonial-wagner-henrique",
    name: "Wagner Henrique",
    role: "CEO da PrimeCode",
    content: "O HUB FDS mudou a forma como nossa equipe colabora. O ambiente é inspirador e a infraestrutura é impecável.",
    avatar: "https://i.pravatar.cc/150?u=ricardo",
  },
  {
    id: "testimonial-ana-oliveira",
    name: "Ana Oliveira",
    role: "Fundadora da CreativeMind",
    content: "Melhor lugar em Arapiraca para realizar workshops. O suporte da equipe é sensacional e o espaço é muito moderno.",
    avatar: "https://i.pravatar.cc/150?u=ana",
  },
  {
    id: "testimonial-marcos-lima",
    name: "Marcos Lima",
    role: "Desenvolvedor Fullstack",
    content: "O networking que fiz aqui valeu cada centavo. Conectei-me com parceiros que hoje são fundamentais para meu negócio.",
    avatar: "https://i.pravatar.cc/150?u=marcos",
  },
]