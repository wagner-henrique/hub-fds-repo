"use client";
import React from "react";
import { motion, Variants } from "framer-motion";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_OUT_SOFT = [0.21, 0.47, 0.32, 0.98] as const;

const variantMap: Record<string, Variants> = {
  "slide-up": {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  "slide-down": {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 },
  },
  "slide-left": {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  "slide-right": {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  "fade": {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  "scale-up": {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1 },
  },
  "scale-down": {
    hidden: { opacity: 0, scale: 1.06 },
    visible: { opacity: 1, scale: 1 },
  },
};

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  variant?: keyof typeof variantMap;
  margin?: string;
  once?: boolean;
}

export const ScrollReveal = ({
  children,
  className = "",
  delay = 0,
  duration = 0.7,
  variant = "slide-up",
  margin = "-80px",
  once = true,
}: ScrollRevealProps) => {
  const variants = variantMap[variant] ?? variantMap["slide-up"];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin }}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: EASE_OUT_EXPO,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
  itemVariant?: keyof typeof variantMap;
  margin?: string;
  once?: boolean;
}

const containerVariants = (stagger: number, delayChildren: number): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});

export const StaggerContainer = ({
  children,
  className = "",
  stagger = 0.1,
  delayChildren = 0,
  itemVariant = "slide-up",
  margin = "-80px",
  once = true,
}: StaggerContainerProps) => {
  const itemVariants = variantMap[itemVariant] ?? variantMap["slide-up"];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin }}
      variants={containerVariants(stagger, delayChildren)}
      className={className}
    >
      {React.Children.map(children, (child) => (
        <motion.div
          variants={{
            ...itemVariants,
            visible: {
              ...(itemVariants.visible as object),
              transition: {
                duration: 0.6,
                ease: EASE_OUT_SOFT,
              },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};


interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof variantMap;
  duration?: number;
}

export const StaggerItem = ({
  children,
  className = "",
  variant = "slide-up",
  duration = 0.6,
}: StaggerItemProps) => {
  const variants = variantMap[variant] ?? variantMap["slide-up"];

  return (
    <motion.div
      variants={{
        ...variants,
        visible: {
          ...(variants.visible as object),
          transition: {
            duration,
            ease: EASE_OUT_SOFT,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};