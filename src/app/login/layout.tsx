import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Acesso ao ERP",
  description: "Área de login administrativo do HUB FDS.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function LoginLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}