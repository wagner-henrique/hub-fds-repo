export type LandingSpace = {
  id: string
  title: string
  description: string
  capacity: string
  image: string
  features: string[]
}

export type LandingTestimonial = {
  id: string
  name: string
  role: string
  content: string
  avatar: string
}

export type LandingContentResponse = {
  spaces: LandingSpace[]
  testimonials: LandingTestimonial[]
  updatedAt: string | null
}