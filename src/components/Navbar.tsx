"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import BookingDialog from './BookingDialog';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: "Início",   href: "#home"    },
  { label: "Espaços",  href: "#espacos" },
  { label: "Reservas", href: "#reserva" },
  { label: "Contato",  href: "#contato" },
];

const Navbar = () => {
  const [scrolled, setScrolled]       = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [mobileOpen, setMobileOpen]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sectionIds = navLinks.map((l) => l.href.replace("#", ""));
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const handleNavClick = () => setMobileOpen(false);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.75)",
          backdropFilter: "blur(16px)",
          borderBottom: scrolled
            ? "1px solid rgba(var(--primary-rgb), 0.12)"
            : "1px solid transparent",
          boxShadow: scrolled
            ? "0 4px 24px -8px rgba(0,0,0,0.08)"
            : "none",
        }}
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">

          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              className="overflow-hidden rounded-full"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src="/logo.png"
                alt="HUB FDS Logo"
                width={40}
                height={40}
                className="rounded-full"
              />
            </motion.div>
            <motion.span
              className="font-bold text-xl tracking-tight text-primary"
              whileHover={{ letterSpacing: "0.02em" }}
              transition={{ duration: 0.2 }}
            >
              HUB FDS
            </motion.span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = activeSection === link.href.replace("#", "");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-sm font-medium transition-colors duration-150 hover:text-primary"
                  style={{ color: isActive ? "var(--primary)" : undefined }}
                >
                  {link.label}

                  <motion.span
                    className="absolute -bottom-1 left-0 h-[2px] bg-primary rounded-full"
                    initial={false}
                    animate={{ width: isActive ? "100%" : "0%" }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  />
                </Link>
              );
            })}

            <BookingDialog>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="bg-primary text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Agendar Visita
              </motion.button>
            </BookingDialog>
          </div>

          <motion.button
            className="md:hidden p-2 rounded-xl text-primary hover:bg-primary/10 transition-colors"
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0,   opacity: 1 }}
                  exit={{   rotate:  90,  opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={22} />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90,  opacity: 0 }}
                  animate={{ rotate: 0,   opacity: 1 }}
                  exit={{   rotate: -90,  opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={22} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{   opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed top-[72px] left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-primary/10 shadow-xl shadow-black/5 md:hidden"
          >
            <div className="container mx-auto px-6 py-6 flex flex-col gap-2">
              {navLinks.map((link, i) => {
                const isActive = activeSection === link.href.replace("#", "");
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.2 }}
                  >
                    <Link
                      href={link.href}
                      onClick={handleNavClick}
                      className="flex items-center justify-between py-3 px-4 rounded-xl font-medium text-sm transition-colors hover:bg-primary/5 hover:text-primary"
                      style={{
                        color: isActive ? "var(--primary)" : undefined,
                        backgroundColor: isActive ? "rgba(var(--primary-rgb), 0.06)" : undefined,
                      }}
                    >
                      {link.label}
                      {isActive && (
                        <motion.span
                          layoutId="mobile-active-dot"
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}

              <div className="pt-2 mt-2 border-t border-primary/10">
                <BookingDialog>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleNavClick}
                    className="w-full bg-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Agendar Visita
                  </motion.button>
                </BookingDialog>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;