import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { FALLBACK_SPACES, FALLBACK_TESTIMONIALS } from "@/lib/landing-fallback"
import type { LandingContentResponse, LandingSpace, LandingTestimonial } from "@/types/landing"

const LANDING_SPACES_KEY = "landing_spaces"
const LANDING_TESTIMONIALS_KEY = "landing_testimonials"

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string")

const isLandingSpace = (value: unknown): value is LandingSpace => {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.capacity === "string" &&
    typeof candidate.image === "string" &&
    isStringArray(candidate.features)
  )
}

const isLandingTestimonial = (value: unknown): value is LandingTestimonial => {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.role === "string" &&
    typeof candidate.content === "string" &&
    typeof candidate.avatar === "string"
  )
}

const parseSettingArray = <T>(
  input: string,
  validator: (item: unknown) => item is T,
  fallback: T[]
): T[] => {
  try {
    const parsed = JSON.parse(input)
    if (!Array.isArray(parsed)) {
      return fallback
    }

    const validated = parsed.filter(validator)
    return validated.length > 0 ? validated : fallback
  } catch {
    return fallback
  }
}

export async function GET() {
  try {
    const [spacesSetting, testimonialsSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: LANDING_SPACES_KEY } }),
      prisma.setting.findUnique({ where: { key: LANDING_TESTIMONIALS_KEY } }),
    ])

    const spaces = spacesSetting
      ? parseSettingArray(spacesSetting.value, isLandingSpace, FALLBACK_SPACES)
      : FALLBACK_SPACES

    const testimonials = testimonialsSetting
      ? parseSettingArray(testimonialsSetting.value, isLandingTestimonial, FALLBACK_TESTIMONIALS)
      : FALLBACK_TESTIMONIALS

    const updatedAt =
      spacesSetting?.updatedAt?.toISOString() ?? testimonialsSetting?.updatedAt?.toISOString() ?? null

    const payload: LandingContentResponse = {
      spaces,
      testimonials,
      updatedAt,
    }

    return NextResponse.json(payload)
  } catch {
    const payload: LandingContentResponse = {
      spaces: FALLBACK_SPACES,
      testimonials: FALLBACK_TESTIMONIALS,
      updatedAt: null,
    }

    return NextResponse.json(payload)
  }
}