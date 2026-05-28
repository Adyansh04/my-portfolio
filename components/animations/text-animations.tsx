"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView, Variants } from "framer-motion";
import { useColorTheme } from "../color-theme-provider";

// Glitch Effect Component
export function GlitchText({
  children,
  className = "",
  intensity = "medium",
  continuous = false,
}: {
  children: string;
  className?: string;
  intensity?: "low" | "medium" | "high";
  continuous?: boolean;
}) {
  const { colors } = useColorTheme();
  const [isGlitching, setIsGlitching] = useState(continuous);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.5 });

  const glitchConfig = {
    low: { duration: 150, frequency: 5000 },
    medium: { duration: 200, frequency: 3000 },
    high: { duration: 300, frequency: 2000 },
  };

  useEffect(() => {
    if (!continuous && isInView) {
      setIsGlitching(true);
      const timer = setTimeout(() => setIsGlitching(false), glitchConfig[intensity].duration * 3);
      return () => clearTimeout(timer);
    }
  }, [isInView, continuous, intensity]);

  useEffect(() => {
    if (continuous) {
      const interval = setInterval(() => {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), glitchConfig[intensity].duration * 2);
      }, glitchConfig[intensity].frequency);
      return () => clearInterval(interval);
    }
  }, [continuous, intensity]);

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      {/* Main text */}
      <span className="relative z-10">{children}</span>

      {/* Glitch layers */}
      {isGlitching && (
        <>
          <motion.span
            className="absolute inset-0 z-20"
            style={{
              color: colors.primary,
              textShadow: `2px 0 ${colors.primary}`,
              clipPath: "polygon(0 0, 100% 0, 100% 45%, 0 45%)",
            }}
            animate={{
              x: [0, -3, 3, -2, 0],
              opacity: [1, 0.8, 1, 0.9, 1],
            }}
            transition={{ duration: 0.2, repeat: 2 }}
          >
            {children}
          </motion.span>
          <motion.span
            className="absolute inset-0 z-20"
            style={{
              color: "#ff0040",
              textShadow: "-2px 0 #ff0040",
              clipPath: "polygon(0 55%, 100% 55%, 100% 100%, 0 100%)",
            }}
            animate={{
              x: [0, 3, -3, 2, 0],
              opacity: [1, 0.9, 1, 0.8, 1],
            }}
            transition={{ duration: 0.2, repeat: 2, delay: 0.05 }}
          >
            {children}
          </motion.span>
        </>
      )}
    </div>
  );
}

// Typewriter Effect Component
export function TypewriterText({
  text,
  className = "",
  speed = 50,
  delay = 0,
  cursor = true,
  onComplete,
}: {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  onComplete?: () => void;
}) {
  const { colors } = useColorTheme();
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!isInView) return;

    let currentIndex = 0;
    const timeoutId = setTimeout(() => {
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [isInView, text, speed, delay, onComplete]);

  return (
    <span ref={ref} className={className}>
      {displayedText}
      {cursor && !isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          style={{ color: colors.primary }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}

// Text Reveal on Scroll Component
export function TextRevealOnScroll({
  children,
  className = "",
  direction = "up",
  delay = 0,
  duration = 0.6,
  blur = true,
}: {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  blur?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        ...directions[direction],
        filter: blur ? "blur(10px)" : "blur(0px)",
      }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0, filter: "blur(0px)" }
          : { opacity: 0, ...directions[direction], filter: blur ? "blur(10px)" : "blur(0px)" }
      }
      transition={{
        duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Neon Text Glow Pulse Component
export function NeonGlowText({
  children,
  className = "",
  intensity = "medium",
  pulseSpeed = 2,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: "low" | "medium" | "high";
  pulseSpeed?: number;
}) {
  const { colors } = useColorTheme();

  const glowIntensity = {
    low: { blur1: 10, blur2: 20, opacity: 0.5 },
    medium: { blur1: 20, blur2: 40, opacity: 0.7 },
    high: { blur1: 30, blur2: 60, opacity: 0.9 },
  };

  const config = glowIntensity[intensity];

  return (
    <motion.span
      className={`relative inline-block ${className}`}
      style={{ color: colors.primary }}
      animate={{
        textShadow: [
          `0 0 ${config.blur1}px ${colors.primary}${Math.round(config.opacity * 100).toString(16)}, 0 0 ${config.blur2}px ${colors.primary}${Math.round(config.opacity * 50).toString(16)}`,
          `0 0 ${config.blur1 * 1.5}px ${colors.primary}${Math.round(config.opacity * 100).toString(16)}, 0 0 ${config.blur2 * 1.5}px ${colors.primary}${Math.round(config.opacity * 70).toString(16)}`,
          `0 0 ${config.blur1}px ${colors.primary}${Math.round(config.opacity * 100).toString(16)}, 0 0 ${config.blur2}px ${colors.primary}${Math.round(config.opacity * 50).toString(16)}`,
        ],
      }}
      transition={{
        duration: pulseSpeed,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.span>
  );
}

// Letter Stagger Animation Component
export function LetterStagger({
  text,
  className = "",
  staggerDelay = 0.03,
  initialDelay = 0,
  animation = "fadeUp",
}: {
  text: string;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
  animation?: "fadeUp" | "fadeIn" | "scaleIn" | "slideIn";
}) {
  const { colors } = useColorTheme();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const animations: Record<string, Variants> = {
    fadeUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.5 },
      visible: { opacity: 1, scale: 1 },
    },
    slideIn: {
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0 },
    },
  };

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };

  const letterVariants = animations[animation];

  return (
    <motion.span
      ref={ref}
      className={`inline-block ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {text.split("").map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          variants={letterVariants}
          transition={{
            duration: 0.4,
            ease: [0.25, 0.4, 0.25, 1],
          }}
          className="inline-block"
          style={{
            marginRight: char === " " ? "0.25em" : undefined,
            color: char !== " " ? undefined : "transparent",
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  );
}

// Word Stagger Animation (for longer text)
export function WordStagger({
  text,
  className = "",
  staggerDelay = 0.08,
  initialDelay = 0,
  highlightWords = [],
}: {
  text: string;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
  highlightWords?: string[];
}) {
  const { colors } = useColorTheme();
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const words = text.split(" ");

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };

  const wordVariants: Variants = {
    hidden: { opacity: 0, y: 15, filter: "blur(5px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.5,
        ease: [0.25, 0.4, 0.25, 1],
      },
    },
  };

  return (
    <motion.span
      ref={ref}
      className={`inline ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {words.map((word, index) => {
        const isHighlighted = highlightWords.includes(word.toLowerCase());
        return (
          <motion.span
            key={`${word}-${index}`}
            variants={wordVariants}
            className="inline-block mr-[0.25em]"
            style={isHighlighted ? { color: colors.primary } : undefined}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.span>
  );
}

// Scramble Text Effect (Matrix-style)
export function ScrambleText({
  text,
  className = "",
  scrambleSpeed = 30,
  revealDelay = 0,
}: {
  text: string;
  className?: string;
  scrambleSpeed?: number;
  revealDelay?: number;
}) {
  const { colors } = useColorTheme();
  const [displayText, setDisplayText] = useState(text.replace(/./g, " "));
  const [isComplete, setIsComplete] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*";

  useEffect(() => {
    if (!isInView) return;

    let currentIndex = 0;
    let iterations = 0;

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayText((prev) => {
          let newText = "";
          for (let i = 0; i < text.length; i++) {
            if (i < currentIndex) {
              newText += text[i];
            } else if (text[i] === " ") {
              newText += " ";
            } else {
              newText += chars[Math.floor(Math.random() * chars.length)];
            }
          }
          return newText;
        });

        iterations++;
        if (iterations % 3 === 0 && currentIndex < text.length) {
          currentIndex++;
        }

        if (currentIndex >= text.length) {
          clearInterval(interval);
          setDisplayText(text);
          setIsComplete(true);
        }
      }, scrambleSpeed);

      return () => clearInterval(interval);
    }, revealDelay);

    return () => clearTimeout(timeout);
  }, [isInView, text, scrambleSpeed, revealDelay]);

  return (
    <span
      ref={ref}
      className={`font-mono ${className}`}
      style={{ color: isComplete ? undefined : colors.primary }}
    >
      {displayText}
    </span>
  );
}

// Animated Gradient Text
export function AnimatedGradientText({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { colors } = useColorTheme();

  return (
    <motion.span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight}, ${colors.primary})`,
        backgroundSize: "200% auto",
      }}
      animate={{
        backgroundPosition: ["0% center", "200% center"],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {children}
    </motion.span>
  );
}
